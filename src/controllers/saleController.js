// src/controllers/saleController.js
const mongoose  = require('mongoose');
const Sale      = require('../models/Sale');
const Inventory = require('../models/Inventory');
const logger    = require('../config/logger');

exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { buyerName, buyerMobile, buyerGst, saleDate, lines = [], gstPercent = 0, paymentMode, referenceNumber, notes } = req.body;

    // Validate and process lines
    const processedLines = [];
    for (const line of lines) {
      const { productName, warehouse = 'Main Warehouse', qty, sellingPrice } = line;

      // Check stock
      const inv = await Inventory.findOne({ productName, warehouse }).session(session);
      if (!inv || inv.currentStock < qty) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${productName}" in ${warehouse}. Available: ${inv?.currentStock || 0}`,
        });
      }

      processedLines.push({
        productName,
        warehouse,
        qty,
        unit:         inv.unit,
        sellingPrice,
        lineTotal:    qty * sellingPrice,
      });
    }

    const subTotal   = processedLines.reduce((s, l) => s + l.lineTotal, 0);
    const gstAmount  = (gstPercent / 100) * subTotal;
    const grandTotal = subTotal + gstAmount;

    const sale = await Sale.create([{
      buyerName, buyerMobile: buyerMobile || '', buyerGst: buyerGst || '',
      saleDate:   saleDate || new Date(),
      lines:      processedLines,
      subTotal, gstPercent, gstAmount, grandTotal,
      paymentMode: paymentMode || 'cash',
      referenceNumber: referenceNumber || '',
      notes:      notes || '',
      createdBy:  req.userId,
    }], { session });

    // ── Reduce inventory ───────────────────────────────────────────────────────
    for (const line of processedLines) {
      await Inventory.findOneAndUpdate(
        { productName: line.productName, warehouse: line.warehouse },
        { $inc: { currentStock: -line.qty }, $set: { lastUpdated: new Date() } },
        { session }
      );
    }

    await session.commitTransaction();
    logger.info(`Sale created: ${sale[0].invoiceNumber} — Rs ${grandTotal}`);
    res.status(201).json({ success: true, message: 'Sale recorded successfully', data: sale[0] });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Create sale error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to record sale' });
  } finally {
    session.endSession();
  }
};

exports.getAllSales = async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate)   filter.saleDate.$lte = new Date(endDate);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [sales, total] = await Promise.all([
      Sale.find(filter).sort({ saleDate: -1 }).skip(skip).limit(Number(limit)).populate('createdBy', 'name email'),
      Sale.countDocuments(filter),
    ]);
    res.json({ success: true, data: sales, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sales' });
  }
};

exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('createdBy', 'name email');
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch sale' });
  }
};
