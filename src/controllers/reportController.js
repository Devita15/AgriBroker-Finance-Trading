// src/controllers/reportController.js
const Purchase  = require('../models/Purchase');
const Payment   = require('../models/Payment');
const Expense   = require('../models/Expense');
const Sale      = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Farmer    = require('../models/Farmer');
const logger    = require('../config/logger');

const dateFilter = (startDate, endDate, field = 'createdAt') => {
  const filter = {};
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) filter[field].$gte = new Date(startDate);
    if (endDate)   filter[field].$lte = new Date(endDate);
  }
  return filter;
};

// ── P&L Report ─────────────────────────────────────────────────────────────────

exports.getProfitLoss = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const df = dateFilter(startDate, endDate, 'purchaseDate');
    const sf = dateFilter(startDate, endDate, 'saleDate');
    const ef = { ...dateFilter(startDate, endDate, 'expenseDate'), approvalStatus: { $in: ['auto_approved', 'approved'] } };

    const [purchaseAgg, saleAgg, expenseAgg] = await Promise.all([
      Purchase.aggregate([{ $match: df }, { $group: { _id: null, total: { $sum: '$finalPayable' } } }]),
      Sale.aggregate([     { $match: sf }, { $group: { _id: null, total: { $sum: '$grandTotal'  } } }]),
      Expense.aggregate([  { $match: ef }, { $group: { _id: null, total: { $sum: '$amount'      } } }]),
    ]);

    const totalPurchases = purchaseAgg[0]?.total || 0;
    const totalSales     = saleAgg[0]?.total     || 0;
    const totalExpenses  = expenseAgg[0]?.total  || 0;
    const profit         = totalSales - totalPurchases - totalExpenses;

    res.json({
      success: true,
      data: {
        period:         { startDate, endDate },
        totalSales,
        totalPurchases,
        totalExpenses,
        grossProfit:    totalSales - totalPurchases,
        netProfit:      profit,
        profitMargin:   totalSales > 0 ? ((profit / totalSales) * 100).toFixed(2) + '%' : '0%',
      },
    });
  } catch (error) {
    logger.error(`P&L report error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to generate P&L report' });
  }
};

// ── Farmer Report ─────────────────────────────────────────────────────────────

exports.getFarmerReport = async (req, res) => {
  try {
    const { farmerId } = req.params;
    const { startDate, endDate } = req.query;
    const filter = { farmer: farmerId, ...dateFilter(startDate, endDate, 'purchaseDate') };

    const [farmer, purchases, payments, pendingPurchases] = await Promise.all([
      Farmer.findById(farmerId),
      Purchase.aggregate([
        { $match: { ...filter } },
        { $group: { _id: null, totalPurchases: { $sum: 1 }, totalGross: { $sum: '$grossTotal' }, totalFinal: { $sum: '$finalPayable' }, totalPaid: { $sum: '$amountPaid' }, totalDue: { $sum: '$amountDue' } } },
      ]),
      Payment.aggregate([
        { $match: { farmer: require('mongoose').Types.ObjectId.createFromHexString(farmerId), ...dateFilter(startDate, endDate, 'paymentDate') } },
        { $group: { _id: '$paymentMode', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Purchase.find({ farmer: farmerId, status: { $in: ['saved', 'partial'] } }, 'receiptNumber finalPayable amountDue purchaseDate'),
    ]);

    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });

    res.json({
      success: true,
      data: {
        farmer:           { id: farmer._id, name: farmer.name, mobile: farmer.mobile },
        summary:          purchases[0] || {},
        paymentBreakdown: payments,
        pendingPurchases,
      },
    });
  } catch (error) {
    logger.error(`Farmer report error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to generate farmer report' });
  }
};

// ── Product Report ─────────────────────────────────────────────────────────────

exports.getProductReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const purchaseFilter = dateFilter(startDate, endDate, 'purchaseDate');
    const saleFilter     = dateFilter(startDate, endDate, 'saleDate');

    const [purchased, sold, stock] = await Promise.all([
      Purchase.aggregate([
        { $match: purchaseFilter },
        { $unwind: '$lines' },
        { $group: { _id: '$lines.productName', totalQty: { $sum: '$lines.billedQty' }, totalCost: { $sum: '$lines.lineTotal' }, avgRate: { $avg: '$lines.rate' }, count: { $sum: 1 } } },
        { $sort: { totalCost: -1 } },
      ]),
      Sale.aggregate([
        { $match: saleFilter },
        { $unwind: '$lines' },
        { $group: { _id: '$lines.productName', totalQty: { $sum: '$lines.qty' }, totalRevenue: { $sum: '$lines.lineTotal' }, avgPrice: { $avg: '$lines.sellingPrice' }, count: { $sum: 1 } } },
        { $sort: { totalRevenue: -1 } },
      ]),
      Inventory.find({}).sort({ productName: 1 }),
    ]);

    res.json({ success: true, data: { purchased, sold, currentStock: stock } });
  } catch (error) {
    logger.error(`Product report error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to generate product report' });
  }
};

// ── Dashboard Summary ──────────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay   = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalFarmers,
      pendingPayments,
      todayPurchases,
      monthPurchases,
      pendingExpenses,
      lowStockItems,
    ] = await Promise.all([
      Farmer.countDocuments({ isActive: true }),
      Farmer.aggregate([{ $group: { _id: null, total: { $sum: '$pendingDues' } } }]),
      Purchase.countDocuments({ purchaseDate: { $gte: startOfDay } }),
      Purchase.aggregate([
        { $match: { purchaseDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$finalPayable' }, count: { $sum: 1 } } },
      ]),
      Expense.countDocuments({ approvalStatus: 'pending' }),
      Inventory.find({ currentStock: { $lte: 10 } }).select('productName warehouse currentStock unit'),
    ]);

    res.json({
      success: true,
      data: {
        totalActiveFarmers:   totalFarmers,
        totalPendingPayments: pendingPayments[0]?.total || 0,
        todayPurchaseCount:   todayPurchases,
        thisMonthPurchases:   { count: monthPurchases[0]?.count || 0, value: monthPurchases[0]?.total || 0 },
        pendingExpenseApprovals: pendingExpenses,
        lowStockAlerts:       lowStockItems,
      },
    });
  } catch (error) {
    logger.error(`Dashboard error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
};
