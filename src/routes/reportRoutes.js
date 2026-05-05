// src/routes/reportRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/reportController');
const authenticate = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Business Intelligence & Analytics - Dashboard, P&L, Farmer, Product Reports (Phases 12-13)
 */

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get dashboard summary (real-time business metrics)
 *     tags: [Reports]
 *     description: Retrieve key business metrics for dashboard including pending payments, stock alerts, and daily/monthly summaries
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalActiveFarmers:
 *                       type: integer
 *                       description: Total number of active farmers
 *                       example: 45
 *                     totalPendingPayments:
 *                       type: number
 *                       description: Total pending dues from all farmers
 *                       example: 875000
 *                     todayPurchaseCount:
 *                       type: integer
 *                       description: Number of purchases recorded today
 *                       example: 12
 *                     thisMonthPurchases:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                           description: Number of purchases this month
 *                           example: 156
 *                         value:
 *                           type: number
 *                           description: Total purchase value this month
 *                           example: 2450000
 *                     pendingExpenseApprovals:
 *                       type: integer
 *                       description: Number of expenses pending approval
 *                       example: 3
 *                     lowStockAlerts:
 *                       type: array
 *                       description: Products with stock ≤ 10 units
 *                       items:
 *                         type: object
 *                         properties:
 *                           productName:
 *                             type: string
 *                           warehouse:
 *                             type: string
 *                           currentStock:
 *                             type: number
 *                           unit:
 *                             type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/dashboard', authenticate, ctrl.getDashboard);

/**
 * @swagger
 * /api/reports/profit-loss:
 *   get:
 *     summary: Get Profit & Loss statement (Phase 12)
 *     tags: [Reports]
 *     description: Generate complete P&L report including sales, purchases, expenses, and profit margins
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (YYYY-MM-DD)
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (YYYY-MM-DD)
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: P&L report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     period:
 *                       type: object
 *                       properties:
 *                         startDate:
 *                           type: string
 *                         endDate:
 *                           type: string
 *                     totalSales:
 *                       type: number
 *                       description: Total revenue from sales
 *                       example: 5000000
 *                     totalPurchases:
 *                       type: number
 *                       description: Total cost of purchases
 *                       example: 3250000
 *                     totalExpenses:
 *                       type: number
 *                       description: Total operational expenses
 *                       example: 450000
 *                     grossProfit:
 *                       type: number
 *                       description: Sales - Purchases
 *                       example: 1750000
 *                     netProfit:
 *                       type: number
 *                       description: Gross profit - Expenses
 *                       example: 1300000
 *                     profitMargin:
 *                       type: string
 *                       description: Net profit percentage
 *                       example: "26.00%"
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/profit-loss', authenticate, validateDateRange, ctrl.getProfitLoss);

/**
 * @swagger
 * /api/reports/farmer/{farmerId}:
 *   get:
 *     summary: Get comprehensive farmer report
 *     tags: [Reports]
 *     description: Generate detailed report for a specific farmer including purchase history, payment breakdown, and pending dues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
 *         example: "65f1234567890abcdef12345"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter purchases from this date
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter purchases until this date
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Farmer report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     farmer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         mobile:
 *                           type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalPurchases:
 *                           type: integer
 *                           description: Total number of purchases
 *                         totalGross:
 *                           type: number
 *                           description: Gross total of all purchases
 *                         totalFinal:
 *                           type: number
 *                           description: Final payable after deductions
 *                         totalPaid:
 *                           type: number
 *                           description: Total amount paid
 *                         totalDue:
 *                           type: number
 *                           description: Outstanding dues
 *                     paymentBreakdown:
 *                       type: array
 *                       description: Payments grouped by mode
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           total:
 *                             type: number
 *                           count:
 *                             type: integer
 *                     pendingPurchases:
 *                       type: array
 *                       description: List of partially paid purchases
 *       404:
 *         description: Farmer not found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/farmer/:farmerId', authenticate, ctrl.getFarmerReport);

/**
 * @swagger
 * /api/reports/products:
 *   get:
 *     summary: Get product performance report
 *     tags: [Reports]
 *     description: Analyze product performance including purchase trends, sales performance, and current stock levels
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from this date
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter until this date
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Product report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     purchased:
 *                       type: array
 *                       description: Products purchased (inventory in)
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           totalQty:
 *                             type: number
 *                           totalCost:
 *                             type: number
 *                           avgRate:
 *                             type: number
 *                           count:
 *                             type: integer
 *                     sold:
 *                       type: array
 *                       description: Products sold (inventory out)
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           totalQty:
 *                             type: number
 *                           totalRevenue:
 *                             type: number
 *                           avgPrice:
 *                             type: number
 *                           count:
 *                             type: integer
 *                     currentStock:
 *                       type: array
 *                       description: Current inventory levels
 *                       items:
 *                         type: object
 *                         properties:
 *                           productName:
 *                             type: string
 *                           warehouse:
 *                             type: string
 *                           currentStock:
 *                             type: number
 *                           unit:
 *                             type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/products', authenticate, validateDateRange, ctrl.getProductReport);

module.exports = router;