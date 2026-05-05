// src/controllers/expenseController.js
const Expense = require('../models/Expense');
const logger  = require('../config/logger');

// Approval thresholds per spec
const AUTO_APPROVE_BELOW   = 1000;
const OPERATOR_APPROVE_MAX = 9999;
// >= 10000 requires superadmin

const determineInitialStatus = (amount) => {
  if (amount < AUTO_APPROVE_BELOW) return 'auto_approved';
  return 'pending';
};

exports.createExpense = async (req, res) => {
  try {
    const { category, amount, description, expenseDate, paidBy, paidTo, referenceNumber, notes } = req.body;

    const approvalStatus = determineInitialStatus(Number(amount));

    const expense = await Expense.create({
      category, amount, description,
      expenseDate:    expenseDate || new Date(),
      paidBy, paidTo: paidTo || '',
      referenceNumber: referenceNumber || '',
      notes:          notes || '',
      approvalStatus,
      createdBy:      req.userId,
    });

    logger.info(`Expense created: Rs ${amount} (${category}) — status: ${approvalStatus}`);
    res.status(201).json({ success: true, message: 'Expense logged successfully', data: expense });
  } catch (error) {
    logger.error(`Create expense error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to log expense' });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, approvalStatus, startDate, endDate } = req.query;
    const filter = {};
    if (category)       filter.category       = category;
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate);
      if (endDate)   filter.expenseDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ expenseDate: -1 }).skip(skip).limit(Number(limit)).populate('createdBy', 'name email').populate('approvedBy', 'name email'),
      Expense.countDocuments(filter),
    ]);

    res.json({ success: true, data: expenses, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch expenses' });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('createdBy', 'name email').populate('approvedBy', 'name email');
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch expense' });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    if (expense.approvalStatus !== 'pending') {
      return res.status(400).json({ success: false, error: `Expense is already ${expense.approvalStatus}` });
    }

    // Enforce role-based approval limits
    if (expense.amount >= 10000 && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Expenses >= Rs 10,000 require SuperAdmin approval' });
    }
    if (expense.amount >= 1000 && expense.amount < 10000 && !['superadmin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Expenses >= Rs 1,000 require Operator or SuperAdmin approval' });
    }

    expense.approvalStatus = 'approved';
    expense.approvedBy     = req.userId;
    expense.approvedAt     = new Date();
    await expense.save();

    logger.info(`Expense approved: ${expense._id} by ${req.user.email}`);
    res.json({ success: true, message: 'Expense approved', data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to approve expense' });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const { reason } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    if (expense.approvalStatus !== 'pending') {
      return res.status(400).json({ success: false, error: `Expense is already ${expense.approvalStatus}` });
    }

    expense.approvalStatus  = 'rejected';
    expense.rejectionReason = reason || '';
    expense.approvedBy      = req.userId;
    expense.approvedAt      = new Date();
    await expense.save();

    res.json({ success: true, message: 'Expense rejected', data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to reject expense' });
  }
};

exports.cancelExpense = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: 'Cancellation reason is required' });

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    if (expense.approvalStatus === 'cancelled') {
      return res.status(400).json({ success: false, error: 'Expense is already cancelled' });
    }

    expense.approvalStatus = 'cancelled';
    expense.cancelReason   = reason;
    await expense.save();

    res.json({ success: true, message: 'Expense cancelled', data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to cancel expense' });
  }
};

exports.getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { approvalStatus: { $in: ['auto_approved', 'approved'] } };
    if (startDate || endDate) {
      match.expenseDate = {};
      if (startDate) match.expenseDate.$gte = new Date(startDate);
      if (endDate)   match.expenseDate.$lte = new Date(endDate);
    }

    const summary = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = summary.reduce((sum, s) => sum + s.total, 0);
    res.json({ success: true, data: { byCategory: summary, grandTotal } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch expense summary' });
  }
};
