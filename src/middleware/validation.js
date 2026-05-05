// src/middleware/validation.js
const { body, param, query, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth ────────────────────────────────────────────────────────────────────

const validateUserRegistration = [
  body('name').notEmpty().withMessage('Name is required').trim().isLength({ min: 2, max: 100 }),
  body('email').notEmpty().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().isLength({ min: 6, max: 50 }).withMessage('Password must be 6–50 chars'),
  body('role').optional().isIn(['superadmin', 'operator']).withMessage('Invalid role'),
  body('phone').optional().trim().matches(/^\+?[0-9\s\-]{10,15}$/).withMessage('Invalid phone'),
  validateRequest,
];

const validateLogin = [
  body('email').notEmpty().isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

const validateRefreshToken = [
  body('refreshToken').notEmpty().isString().withMessage('Refresh token is required'),
  validateRequest,
];

// ─── Farmer ──────────────────────────────────────────────────────────────────

const validateFarmer = [
  body('name').notEmpty().withMessage('Farmer name is required').trim(),
  body('mobile').notEmpty().matches(/^\+?[0-9\s\-]{10,15}$/).withMessage('Invalid mobile number'),
  body('address').optional().trim(),
  body('village').optional().trim(),
  body('city').optional().trim(),
  body('state').optional().trim(),
  body('bankAccountNumber').optional().trim(),
  body('ifscCode').optional().trim(),
  body('bankName').optional().trim(),
  body('gstNumber').optional().trim(),
  validateRequest,
];

// ─── Purchase ─────────────────────────────────────────────────────────────────

const validatePurchase = [
  body('farmerId').notEmpty().isMongoId().withMessage('Invalid Farmer ID'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid date format'),
  body('lines').isArray({ min: 1 }).withMessage('At least one product line is required'),
  body('lines.*.productName').notEmpty().withMessage('Product name is required'),
  body('lines.*.pricingType')
    .isIn(['kg', 'quintal', 'piece', 'bunch', 'crate', 'dozen', 'flat'])
    .withMessage('Invalid pricing type'),
  body('lines.*.actualQty').isFloat({ min: 0 }).withMessage('Actual qty must be >= 0'),
  body('lines.*.rate').isFloat({ min: 0 }).withMessage('Rate must be >= 0'),
  body('deductions').optional().isObject().withMessage('Deductions must be an object'),
  validateRequest,
];

// ─── Payment ──────────────────────────────────────────────────────────────────

const validatePayment = [
  body('purchaseId').notEmpty().isMongoId().withMessage('Invalid Purchase ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('paymentMode').isIn(['cash', 'upi', 'bank', 'cheque']).withMessage('Invalid payment mode'),
  body('referenceNumber').optional().trim(),
  body('paymentDate').optional().isISO8601().withMessage('Invalid date'),
  validateRequest,
];

// ─── Expense ──────────────────────────────────────────────────────────────────

const validateExpense = [
  body('category')
    .notEmpty()
    .isIn([
      'transport_logistics', 'labour_wages', 'market_fees', 'storage_cold_chain',
      'shop_office', 'repairs_maintenance', 'banking_finance', 'marketing_misc',
    ])
    .withMessage('Invalid category'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be > 0'),
  body('description').notEmpty().withMessage('Description is required').trim(),
  body('paidBy').isIn(['cash', 'upi', 'bank', 'cheque']).withMessage('Invalid payment mode'),
  body('expenseDate').optional().isISO8601().withMessage('Invalid date'),
  body('paidTo').optional().trim(),
  validateRequest,
];

// ─── Sale ─────────────────────────────────────────────────────────────────────

const validateSale = [
  body('buyerName').notEmpty().withMessage('Buyer name is required').trim(),
  body('lines').isArray({ min: 1 }).withMessage('At least one product line is required'),
  body('lines.*.productName').notEmpty().withMessage('Product name is required'),
  body('lines.*.qty').isFloat({ min: 0.01 }).withMessage('Qty must be > 0'),
  body('lines.*.sellingPrice').isFloat({ min: 0.01 }).withMessage('Selling price must be > 0'),
  body('gstPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Invalid GST %'),
  body('paymentMode').optional().isIn(['cash', 'upi', 'bank', 'cheque', 'credit']),
  validateRequest,
];

// ─── Shared ───────────────────────────────────────────────────────────────────

const validateIdParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validateRequest,
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit 1–100').toInt(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validateRequest,
];

const validateDateRange = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  validateRequest,
];

module.exports = {
  validateUserRegistration,
  validateLogin,
  validateRefreshToken,
  validateFarmer,
  validatePurchase,
  validatePayment,
  validateExpense,
  validateSale,
  validateIdParam,
  validatePagination,
  validateDateRange,
  validateRequest,
};
