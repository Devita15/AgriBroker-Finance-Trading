const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed', 
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 50 }).withMessage('Password must be between 6 and 50 characters'),
  
  body('role')
    .optional()
    .isIn(['superadmin', 'operator']).withMessage('Invalid role. Must be superadmin or operator'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-]{10,15}$/).withMessage('Invalid phone number format'),
  
  validateRequest,
];

// Login validation
const validateLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validateRequest,
];

// Refresh token validation
const validateRefreshToken = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Refresh token must be a string'),
  
  validateRequest,
];

// Farmer validations
const validateFarmer = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('mobile')
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^\+?[0-9\s\-]{10,15}$/).withMessage('Invalid mobile number'),
  body('address').optional().trim(),
  body('village').optional().trim(),
  body('city').optional().trim(),
  body('bankAccountNumber').optional().trim(),
  body('ifscCode').optional().trim(),
  body('bankName').optional().trim(),
  body('gstNumber').optional().trim(),
  validateRequest,
];

// Purchase validations
const validatePurchase = [
  body('farmerId')
    .notEmpty().withMessage('Farmer ID is required')
    .isMongoId().withMessage('Invalid Farmer ID format'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid date format'),
  body('lines').optional().isArray().withMessage('Lines must be an array'),
  body('deductions').optional().isObject().withMessage('Deductions must be an object'),
  validateRequest,
];

// Payment validations
const validatePayment = [
  body('purchaseId')
    .notEmpty().withMessage('Purchase ID is required')
    .isMongoId().withMessage('Invalid Purchase ID format'),
  body('amount')
    .isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMode')
    .isIn(['cash', 'upi', 'bank', 'cheque']).withMessage('Invalid payment mode'),
  body('referenceNumber').optional().trim(),
  body('paymentDate').optional().isISO8601().withMessage('Invalid date format'),
  validateRequest,
];

// Expense validations
const validateExpense = [
  body('category').notEmpty().withMessage('Category is required').trim(),
  body('amount')
    .isNumeric().withMessage('Amount must be a number')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('expenseDate').optional().isISO8601().withMessage('Invalid date format'),
  body('description').optional().trim(),
  body('paidBy')
    .isIn(['cash', 'upi', 'bank', 'cheque']).withMessage('Invalid payment mode'),
  body('paidTo').optional().trim(),
  validateRequest,
];

// ID param validation
const validateIdParam = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  validateRequest,
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('sortBy')
    .optional()
    .isString().withMessage('Sort field must be a string'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  validateRequest,
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
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
  validateIdParam,
  validatePagination,
  validateDateRange,
  validateRequest,
};