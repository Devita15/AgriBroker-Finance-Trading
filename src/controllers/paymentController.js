// src/controllers/paymentController.js
const mongoose = require('mongoose');
const Payment  = require('../models/Payment');
const Purchase = require('../models/Purchase');
const Farmer   = require('../models/Farmer');
const Ledger   = require('../models/Ledger');
const logger   = require('../config/logger');

exports.createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { purchaseId, amount, paymentMode, referenceNumber, paymentDate, chequeNumber, chequeDate, bankName, notes } = req.body;

    const purchase = await Purchase.findById(purchaseId).session(session);
    if (!purchase) { await session.abortTransaction(); return res.status(404).json({ success: false, error: 'Purchase not found' }); }
    if (purchase.amountDue <= 0) { await session.abortTransaction(); return res.status(400).json({ success: false, error: 'No outstanding dues for this purchase' }); }

    const payAmount = Math.min(Number(amount), purchase.amountDue);

    const payment = await Payment.create([{
      purchase:       purchaseId,
      farmer:         purchase.farmer,
      amount:         payAmount,
      paymentMode,
      referenceNumber: referenceNumber || '',
      paymentDate:    paymentDate || new Date(),
      chequeStatus:   paymentMode === 'cheque' ? 'pending_clearance' : null,
      chequeNumber:   chequeNumber || '',
      chequeDate:     chequeDate   || null,
      bankName:       bankName     || '',
      notes:          notes        || '',
      createdBy:      req.userId,
    }], { session });

    const pmt = payment[0];

    // ── Update purchase ────────────────────────────────────────────────────────
    const newAmountPaid = purchase.amountPaid + payAmount;
    const newAmountDue  = purchase.finalPayable - newAmountPaid;
    const newStatus     = newAmountDue <= 0 ? 'paid' : 'partial';

    await Purchase.findByIdAndUpdate(purchaseId, {
      amountPaid: newAmountPaid,
      amountDue:  Math.max(0, newAmountDue),
      status:     newStatus,
    }, { session });

    // ── Ledger entry ───────────────────────────────────────────────────────────
    const farmer       = await Farmer.findById(purchase.farmer).session(session);
    const prevBalance  = farmer.pendingDues;
    const newBalance   = prevBalance - payAmount;

    await Ledger.create([{
      farmer:        purchase.farmer,
      entryDate:     pmt.paymentDate,
      entryType:     'payment',
      description:   `Payment via ${paymentMode.toUpperCase()} — Ref: ${referenceNumber || 'N/A'}`,
      debit:         payAmount,
      credit:        0,
      runningBalance: Math.max(0, newBalance),
      refId:         pmt._id,
      refModel:      'Payment',
      createdBy:     req.userId,
    }], { session });

    // ── Update farmer summary ──────────────────────────────────────────────────
    await Farmer.findByIdAndUpdate(purchase.farmer, {
      $inc: { totalPaid: payAmount, pendingDues: -payAmount },
    }, { session });

    await session.commitTransaction();
    logger.info(`Payment recorded: Rs ${payAmount} for purchase ${purchase.receiptNumber}`);

    res.status(201).json({ success: true, message: 'Payment recorded successfully', data: pmt });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Create payment error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to record payment' });
  } finally {
    session.endSession();
  }
};

exports.getPaymentsByPurchase = async (req, res) => {
  try {
    const payments = await Payment.find({ purchase: req.params.purchaseId })
      .sort({ paymentDate: -1 })
      .populate('createdBy', 'name email');
    res.json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
};

exports.getPaymentsByFarmer = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find({ farmer: req.params.farmerId })
        .sort({ paymentDate: -1 }).skip(skip).limit(Number(limit))
        .populate('purchase', 'receiptNumber finalPayable')
        .populate('createdBy', 'name email'),
      Payment.countDocuments({ farmer: req.params.farmerId }),
    ]);

    res.json({ success: true, data: payments, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
};

exports.updateChequeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['cleared', 'bounced'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be cleared or bounced' });
    }

    const payment = await Payment.findByIdAndUpdate(req.params.id, { chequeStatus: status }, { new: true });
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    res.json({ success: true, message: `Cheque marked as ${status}`, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update cheque status' });
  }
};
