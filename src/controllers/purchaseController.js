// src/controllers/purchaseController.js
const mongoose = require('mongoose');
const Purchase  = require('../models/Purchase');
const Farmer    = require('../models/Farmer');
const Ledger    = require('../models/Ledger');
const Inventory = require('../models/Inventory');
const logger    = require('../config/logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Calculate billed qty and line total based on pricing type.
 */
const calcLine = (line) => {
  const { pricingType, bags, weightPerBag, actualQty, qualityDeduction = 0, rate } = line;

  let grossQty = actualQty;
  if (pricingType === 'kg' && bags && weightPerBag) {
    grossQty = bags * weightPerBag;
  }
  const billedQty  = Math.max(0, grossQty - qualityDeduction);
  let   lineTotal  = billedQty * rate;

  if (pricingType === 'flat') {
    lineTotal = rate; // flat = single agreed price
  }

  const unitMap = { kg: 'kg', quintal: 'qtl', piece: 'pcs', bunch: 'bunch', crate: 'crate', dozen: 'doz', flat: 'flat' };

  return { ...line, grossQty, billedQty, lineTotal, unit: unitMap[pricingType] || '' };
};

/**
 * Calculate commission amount (supports fixed or percent).
 */
const calcCommission = (commissionType, commissionValue, grossTotal) => {
  if (commissionType === 'percent') return (commissionValue / 100) * grossTotal;
  return commissionValue || 0;
};

/**
 * Recalculate totals from lines + deductions.
 */
const recalcTotals = (lines, deductions = {}) => {
  const grossTotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const commission  = calcCommission(deductions.commissionType, deductions.commission, grossTotal);
  const totalDeductions = (
    (deductions.transport       || 0) +
    (deductions.labour          || 0) +
    commission                        +
    (deductions.storage         || 0) +
    (deductions.returnDeduction || 0) +
    (deductions.advanceAdjusted || 0) +
    (deductions.other           || 0)
  );
  const finalPayable = Math.max(0, grossTotal - totalDeductions);
  return { grossTotal, totalDeductions, finalPayable };
};

// ── Controllers ───────────────────────────────────────────────────────────────

exports.createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { farmerId, purchaseDate, lines = [], deductions = {}, notes } = req.body;

    const farmer = await Farmer.findById(farmerId).session(session);
    if (!farmer) { await session.abortTransaction(); return res.status(404).json({ success: false, error: 'Farmer not found' }); }

    // Calculate each line
    const processedLines = lines.map(calcLine);
    const { grossTotal, totalDeductions, finalPayable } = recalcTotals(processedLines, deductions);

    // Advance adjustment — pull from farmer's advance balance
    const advanceAdjusted = Math.min(deductions.advanceAdjusted || 0, farmer.advanceBalance);

    const purchase = await Purchase.create([{
      farmer:      farmerId,
      purchaseDate: purchaseDate || new Date(),
      lines:       processedLines,
      deductions:  { ...deductions, advanceAdjusted },
      grossTotal,
      totalDeductions,
      finalPayable: Math.max(0, finalPayable - advanceAdjusted + (deductions.advanceAdjusted || 0) - advanceAdjusted),
      amountPaid:  0,
      amountDue:   finalPayable,
      status:      'saved',
      createdBy:   req.userId,
      notes:       notes || '',
    }], { session });

    const p = purchase[0];

    // ── Ledger entry ─────────────────────────────────────────────────────────
    const prevBalance = farmer.pendingDues;
    const newBalance  = prevBalance + p.finalPayable;

    await Ledger.create([{
      farmer:       farmerId,
      entryDate:    p.purchaseDate,
      entryType:    'purchase',
      description:  `Purchase — ${p.receiptNumber}`,
      debit:        0,
      credit:       p.finalPayable,
      runningBalance: newBalance,
      refId:        p._id,
      refModel:     'Purchase',
      createdBy:    req.userId,
    }], { session });

    // ── Advance ledger if adjusted ────────────────────────────────────────────
    if (advanceAdjusted > 0) {
      await Ledger.create([{
        farmer:       farmerId,
        entryDate:    p.purchaseDate,
        entryType:    'advance_adjusted',
        description:  `Advance adjusted against ${p.receiptNumber}`,
        debit:        advanceAdjusted,
        credit:       0,
        runningBalance: newBalance - advanceAdjusted,
        refId:        p._id,
        refModel:     'Purchase',
        createdBy:    req.userId,
      }], { session });
    }

    // ── Inventory update ──────────────────────────────────────────────────────
    for (const line of processedLines) {
      if (line.pricingType !== 'flat') {
        await Inventory.findOneAndUpdate(
          { productName: line.productName, warehouse: 'Main Warehouse' },
          { $inc: { currentStock: line.billedQty }, $set: { unit: line.unit, lastUpdated: new Date() } },
          { upsert: true, new: true, session }
        );
      }
    }

    // ── Update farmer summary ─────────────────────────────────────────────────
    await Farmer.findByIdAndUpdate(farmerId, {
      $inc: {
        totalPurchases:    1,
        totalPurchaseValue: p.grossTotal,
        pendingDues:       p.finalPayable,
        advanceBalance:    -advanceAdjusted,
      },
    }, { session });

    await session.commitTransaction();
    logger.info(`Purchase saved: ${p.receiptNumber} for farmer ${farmer.name}`);

    res.status(201).json({ success: true, message: 'Purchase saved successfully', data: p });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Create purchase error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to save purchase' });
  } finally {
    session.endSession();
  }
};

exports.getAllPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 20, farmerId, status, startDate, endDate, sortOrder = 'desc' } = req.query;
    const filter = {};
    if (farmerId)  filter.farmer = farmerId;
    if (status)    filter.status = status;
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate)   filter.purchaseDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .sort({ purchaseDate: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip).limit(Number(limit))
        .populate('farmer', 'name mobile')
        .populate('createdBy', 'name email'),
      Purchase.countDocuments(filter),
    ]);

    res.json({ success: true, data: purchases, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error(`Get purchases error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch purchases' });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('farmer', 'name mobile address gstNumber bankAccountNumber ifscCode bankName')
      .populate('createdBy', 'name email');
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
    res.json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch purchase' });
  }
};

exports.getPurchaseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.purchaseDate = {};
      if (startDate) match.purchaseDate.$gte = new Date(startDate);
      if (endDate)   match.purchaseDate.$lte = new Date(endDate);
    }

    const summary = await Purchase.aggregate([
      { $match: match },
      { $group: {
        _id:              null,
        totalPurchases:   { $sum: 1 },
        totalGrossValue:  { $sum: '$grossTotal' },
        totalFinalValue:  { $sum: '$finalPayable' },
        totalPaid:        { $sum: '$amountPaid' },
        totalDue:         { $sum: '$amountDue' },
      }},
    ]);

    res.json({ success: true, data: summary[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
};
