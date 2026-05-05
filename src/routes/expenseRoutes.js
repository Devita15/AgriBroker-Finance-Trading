// src/routes/expenseRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/expenseController');
const authenticate = require('../middleware/auth');
const { validateExpense, validateIdParam, validatePagination } = require('../middleware/validation');
const auditLog   = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense Management with Role-Based Approval Workflow (Phase 9)
 */

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     description: Log an expense with automatic approval for amounts less than ₹1000
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - amount
 *               - description
 *               - paidBy
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [transport_logistics, labour_wages, market_fees, storage_cold_chain, shop_office, repairs_maintenance, banking_finance, marketing_misc]
 *                 description: Expense category
 *                 example: "transport_logistics"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Expense amount (₹)
 *                 example: 1500
 *               description:
 *                 type: string
 *                 description: Detailed description of expense
 *                 example: "Truck transportation from farm to market"
 *               expenseDate:
 *                 type: string
 *                 format: date
 *                 description: Date of expense (defaults to current date)
 *                 example: "2026-05-05"
 *               paidBy:
 *                 type: string
 *                 enum: [cash, upi, bank, cheque]
 *                 description: Payment method
 *                 example: "cash"
 *               paidTo:
 *                 type: string
 *                 description: Recipient name
 *                 example: "Sharma Transport Co."
 *               referenceNumber:
 *                 type: string
 *                 description: Transaction reference (UPI ID, cheque number, etc.)
 *                 example: "TRANS123456"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Peak season transportation"
 *             examples:
 *               Auto-approved Expense (< ₹1000):
 *                 value:
 *                   category: "market_fees"
 *                   amount: 500
 *                   description: "Market entry fees"
 *                   paidBy: "cash"
 *                   paidTo: "APMC Market"
 *               Pending Approval (₹1000 - ₹9999):
 *                 value:
 *                   category: "labour_wages"
 *                   amount: 5000
 *                   description: "Daily wages for 10 workers"
 *                   paidBy: "bank"
 *                   referenceNumber: "NEFT123456"
 *               Requires SuperAdmin (≥ ₹10000):
 *                 value:
 *                   category: "storage_cold_chain"
 *                   amount: 25000
 *                   description: "Cold storage rent for May"
 *                   paidBy: "cheque"
 *                   paidTo: "Cold Storage Pvt Ltd"
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Expense logged successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     category:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     description:
 *                       type: string
 *                     expenseDate:
 *                       type: string
 *                     paidBy:
 *                       type: string
 *                     approvalStatus:
 *                       type: string
 *                     createdBy:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, validateExpense, auditLog('CREATE_EXPENSE', 'Expense'), ctrl.createExpense);

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses with filters
 *     tags: [Expenses]
 *     description: Retrieve expenses with pagination, category filters, approval status, and date range
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [transport_logistics, labour_wages, market_fees, storage_cold_chain, shop_office, repairs_maintenance, banking_finance, marketing_misc]
 *         description: Filter by expense category
 *       - in: query
 *         name: approvalStatus
 *         schema:
 *           type: string
 *           enum: [auto_approved, pending, approved, rejected, cancelled]
 *         description: Filter by approval status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter until this date
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/', authenticate, validatePagination, ctrl.getAllExpenses);

/**
 * @swagger
 * /api/expenses/summary:
 *   get:
 *     summary: Get expense summary by category
 *     tags: [Expenses]
 *     description: Get aggregated expense summary grouped by category for approved expenses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter until this date
 *     responses:
 *       200:
 *         description: Expense summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     byCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           total:
 *                             type: number
 *                           count:
 *                             type: integer
 *                     grandTotal:
 *                       type: number
 *       401:
 *         description: Not authenticated
 */
router.get('/summary', authenticate, ctrl.getExpenseSummary);

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get expense by ID
 *     tags: [Expenses]
 *     description: Retrieve detailed information about a specific expense
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense retrieved successfully
 *       404:
 *         description: Expense not found
 */
router.get('/:id', authenticate, validateIdParam, ctrl.getExpenseById);

/**
 * @swagger
 * /api/expenses/{id}/approve:
 *   patch:
 *     summary: Approve an expense
 *     tags: [Expenses]
 *     description: Approve a pending expense (role-based: Operator can approve up to ₹9999, SuperAdmin for ₹10000+)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       403:
 *         description: Insufficient permissions for this expense amount
 *       404:
 *         description: Expense not found
 */
router.patch('/:id/approve', authenticate, validateIdParam, auditLog('APPROVE_EXPENSE', 'Expense'), ctrl.approveExpense);

/**
 * @swagger
 * /api/expenses/{id}/reject:
 *   patch:
 *     summary: Reject an expense
 *     tags: [Expenses]
 *     description: Reject a pending expense with reason
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for rejection
 *                 example: "Missing invoice documentation"
 *     responses:
 *       200:
 *         description: Expense rejected successfully
 *       404:
 *         description: Expense not found
 */
router.patch('/:id/reject', authenticate, validateIdParam, auditLog('REJECT_EXPENSE', 'Expense'), ctrl.rejectExpense);

/**
 * @swagger
 * /api/expenses/{id}/cancel:
 *   patch:
 *     summary: Cancel an expense
 *     tags: [Expenses]
 *     description: Cancel an expense (any status) with reason
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *                 example: "Expense recorded by mistake"
 *     responses:
 *       200:
 *         description: Expense cancelled successfully
 *       404:
 *         description: Expense not found
 */
router.patch('/:id/cancel', authenticate, validateIdParam, auditLog('CANCEL_EXPENSE', 'Expense'), ctrl.cancelExpense);

module.exports = router;