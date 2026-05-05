// src/routes/farmerRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/farmerController');
const authenticate = require('../middleware/auth');
const { validateFarmer, validateIdParam, validatePagination } = require('../middleware/validation');
const auditLog   = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Farmers
 *   description: Farmer management - Registration, Updates, and Ledger Tracking (Phase 1 & 8)
 */

/**
 * @swagger
 * /api/farmers:
 *   get:
 *     summary: Get all farmers with pagination and search
 *     tags: [Farmers]
 *     description: Retrieve a list of all farmers with filtering, sorting, and pagination options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records per page
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by farmer name, mobile number, or village
 *         example: "Suresh"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, mobile, createdAt, totalPurchaseValue, pendingDues]
 *           default: createdAt
 *         description: Field to sort by
 *         example: "name"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *         example: true
 *     responses:
 *       200:
 *         description: Farmers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       mobile:
 *                         type: string
 *                       village:
 *                         type: string
 *                       totalPurchaseValue:
 *                         type: number
 *                       pendingDues:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, validatePagination, ctrl.getAllFarmers);

/**
 * @swagger
 * /api/farmers:
 *   post:
 *     summary: Register a new farmer
 *     tags: [Farmers]
 *     description: Create a new farmer record with basic information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - mobile
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Suresh Patel"
 *                 description: Full name of the farmer
 *               mobile:
 *                 type: string
 *                 pattern: "^[0-9]{10}$"
 *                 example: "9876543210"
 *                 description: 10-digit mobile number
 *               address:
 *                 type: string
 *                 example: "123 Farm Road"
 *                 description: Complete address
 *               village:
 *                 type: string
 *                 example: "Green Valley Village"
 *                 description: Village name
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *                 description: City name
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *                 description: State name
 *               bankAccountNumber:
 *                 type: string
 *                 example: "12345678901234"
 *                 description: Bank account number for payments
 *               ifscCode:
 *                 type: string
 *                 pattern: "^[A-Z]{4}0[A-Z0-9]{6}$"
 *                 example: "SBIN0001234"
 *                 description: IFSC code of the bank branch
 *               bankName:
 *                 type: string
 *                 example: "State Bank of India"
 *                 description: Name of the bank
 *               gstNumber:
 *                 type: string
 *                 pattern: "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$"
 *                 example: "27AAAAA0000A1Z"
 *                 description: GST number (if registered)
 *     responses:
 *       201:
 *         description: Farmer registered successfully
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
 *                   example: "Farmer registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     mobile:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *       400:
 *         description: Validation error
 *       409:
 *         description: Farmer with this mobile already exists
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, validateFarmer, auditLog('CREATE_FARMER', 'Farmer'), ctrl.createFarmer);

/**
 * @swagger
 * /api/farmers/{id}:
 *   get:
 *     summary: Get farmer by ID
 *     tags: [Farmers]
 *     description: Retrieve detailed information of a specific farmer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
 *         example: "65f1234567890abcdef12345"
 *     responses:
 *       200:
 *         description: Farmer details retrieved successfully
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
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     mobile:
 *                       type: string
 *                     address:
 *                       type: string
 *                     village:
 *                       type: string
 *                     city:
 *                       type: string
 *                     state:
 *                       type: string
 *                     totalPurchases:
 *                       type: number
 *                     totalPurchaseValue:
 *                       type: number
 *                     totalPaid:
 *                       type: number
 *                     pendingDues:
 *                       type: number
 *                     advanceBalance:
 *                       type: number
 *                     isActive:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Farmer not found
 *       401:
 *         description: Not authenticated
 */
router.get('/:id', authenticate, validateIdParam, ctrl.getFarmerById);

/**
 * @swagger
 * /api/farmers/{id}:
 *   put:
 *     summary: Update farmer information
 *     tags: [Farmers]
 *     description: Update farmer details (cannot modify summary fields like totalPurchaseValue)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Suresh Kumar Patel"
 *               mobile:
 *                 type: string
 *                 example: "9876543211"
 *               address:
 *                 type: string
 *                 example: "456 New Farm Road"
 *               village:
 *                 type: string
 *                 example: "New Green Valley"
 *               city:
 *                 type: string
 *                 example: "Pune"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               bankAccountNumber:
 *                 type: string
 *                 example: "98765432109876"
 *               ifscCode:
 *                 type: string
 *                 example: "HDFC0005678"
 *               bankName:
 *                 type: string
 *                 example: "HDFC Bank"
 *               gstNumber:
 *                 type: string
 *                 example: "27BBBBB0000B2Z"
 *     responses:
 *       200:
 *         description: Farmer updated successfully
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
 *                   example: "Farmer updated successfully"
 *                 data:
 *                   type: object
 *       404:
 *         description: Farmer not found
 *       401:
 *         description: Not authenticated
 */
router.put('/:id', authenticate, validateIdParam, auditLog('UPDATE_FARMER', 'Farmer'), ctrl.updateFarmer);

/**
 * @swagger
 * /api/farmers/{id}/deactivate:
 *   patch:
 *     summary: Deactivate farmer
 *     tags: [Farmers]
 *     description: Soft delete - deactivate farmer without removing from database
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
 *     responses:
 *       200:
 *         description: Farmer deactivated successfully
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
 *                   example: "Farmer deactivated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Farmer not found
 *       401:
 *         description: Not authenticated
 */
router.patch('/:id/deactivate', authenticate, validateIdParam, auditLog('DEACTIVATE_FARMER', 'Farmer'), ctrl.deactivateFarmer);

/**
 * @swagger
 * /api/farmers/{id}/ledger:
 *   get:
 *     summary: Get farmer ledger entries (Phase 8)
 *     tags: [Farmers]
 *     description: Retrieve complete financial ledger for a farmer including purchases, payments, and adjustments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Farmer ID
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
 *           default: 50
 *         description: Entries per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter entries from this date
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter entries until this date
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Farmer ledger retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 farmer:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     mobile:
 *                       type: string
 *                     pendingDues:
 *                       type: number
 *                     advanceBalance:
 *                       type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       entryDate:
 *                         type: string
 *                         format: date-time
 *                       transactionType:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       balance:
 *                         type: number
 *                       description:
 *                         type: string
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Farmer not found
 *       401:
 *         description: Not authenticated
 */
router.get('/:id/ledger', authenticate, validateIdParam, ctrl.getFarmerLedger);

module.exports = router;