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
 *   description: Phase 9 — Expense Management with Approval Workflow
 */

router.post('/',                  authenticate, validateExpense, auditLog('CREATE_EXPENSE', 'Expense'), ctrl.createExpense);
router.get('/',                   authenticate, validatePagination, ctrl.getAllExpenses);
router.get('/summary',            authenticate, ctrl.getExpenseSummary);
router.get('/:id',                authenticate, validateIdParam, ctrl.getExpenseById);
router.patch('/:id/approve',      authenticate, validateIdParam, auditLog('APPROVE_EXPENSE', 'Expense'), ctrl.approveExpense);
router.patch('/:id/reject',       authenticate, validateIdParam, auditLog('REJECT_EXPENSE', 'Expense'), ctrl.rejectExpense);
router.patch('/:id/cancel',       authenticate, validateIdParam, auditLog('CANCEL_EXPENSE', 'Expense'), ctrl.cancelExpense);

module.exports = router;
