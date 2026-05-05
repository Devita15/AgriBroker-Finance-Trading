// src/routes/purchaseRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/purchaseController');
const authenticate = require('../middleware/auth');
const { validatePurchase, validateIdParam, validatePagination } = require('../middleware/validation');
const auditLog   = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Complete Purchase Management - Goods Arrival, Pricing, Deductions, Receipt (Phases 2-6)
 */

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Create a new purchase
 *     tags: [Purchases]
 *     description: Record a complete purchase with multiple products, pricing types, deductions, and inventory updates
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - farmerId
 *               - lines
 *             properties:
 *               farmerId:
 *                 type: string
 *                 description: ID of the farmer
 *                 example: "65f1234567890abcdef12345"
 *               purchaseDate:
 *                 type: string
 *                 format: date
 *                 description: Date of purchase (defaults to current date)
 *                 example: "2026-05-05"
 *               lines:
 *                 type: array
 *                 description: Array of products purchased
 *                 items:
 *                   type: object
 *                   required:
 *                     - productName
 *                     - pricingType
 *                     - rate
 *                   properties:
 *                     productName:
 *                       type: string
 *                       example: "Wheat"
 *                     pricingType:
 *                       type: string
 *                       enum: [kg, quintal, piece, bunch, crate, dozen, flat]
 *                       description: Pricing method
 *                     bags:
 *                       type: number
 *                       description: Number of bags (for kg pricing)
 *                       example: 10
 *                     weightPerBag:
 *                       type: number
 *                       description: Weight per bag in kg (for kg pricing)
 *                       example: 50
 *                     actualQty:
 *                       type: number
 *                       description: Actual quantity received
 *                       example: 500
 *                     qualityDeduction:
 *                       type: number
 *                       description: Quantity deducted for quality issues
 *                       example: 10
 *                     rate:
 *                       type: number
 *                       description: Rate per unit
 *                       example: 2000
 *                     notes:
 *                       type: string
 *                       example: "Premium quality wheat"
 *               deductions:
 *                 type: object
 *                 description: Various deductions from gross total
 *                 properties:
 *                   transport:
 *                     type: number
 *                     description: Transport charges
 *                     example: 1000
 *                   labour:
 *                     type: number
 *                     description: Labour charges
 *                     example: 500
 *                   commission:
 *                     type: number
 *                     description: Commission amount
 *                     example: 2000
 *                   commissionType:
 *                     type: string
 *                     enum: [fixed, percent]
 *                     description: Commission calculation type
 *                     default: fixed
 *                   storage:
 *                     type: number
 *                     description: Storage charges
 *                     example: 500
 *                   storageNote:
 *                     type: string
 *                     example: "Cold storage charges"
 *                   returnDeduction:
 *                     type: number
 *                     description: Return deduction amount
 *                     example: 1000
 *                   returnNote:
 *                     type: string
 *                     example: "Damaged goods return"
 *                   advanceAdjusted:
 *                     type: number
 *                     description: Advance amount to adjust
 *                     example: 5000
 *                   other:
 *                     type: number
 *                     description: Other miscellaneous charges
 *                     example: 300
 *                   otherNote:
 *                     type: string
 *                     example: "Handling charges"
 *               notes:
 *                 type: string
 *                 description: General purchase notes
 *                 example: "Season's first harvest"
 *             examples:
 *               Single Product - KG Pricing:
 *                 value:
 *                   farmerId: "65f1234567890abcdef12345"
 *                   purchaseDate: "2026-05-05"
 *                   lines: [{
 *                     productName: "Wheat",
 *                     pricingType: "kg",
 *                     bags: 10,
 *                     weightPerBag: 50,
 *                     actualQty: 500,
 *                     qualityDeduction: 10,
 *                     rate: 2000,
 *                     notes: "Premium wheat"
 *                   }]
 *                   deductions: {
 *                     transport: 1000,
 *                     labour: 500,
 *                     commission: 2000,
 *                     commissionType: "fixed",
 *                     storage: 500,
 *                     advanceAdjusted: 5000
 *                   }
 *               Multiple Products:
 *                 value:
 *                   farmerId: "65f1234567890abcdef12345"
 *                   lines: [
 *                     {
 *                       productName: "Wheat",
 *                       pricingType: "kg",
 *                       bags: 10,
 *                       weightPerBag: 50,
 *                       rate: 2000
 *                     },
 *                     {
 *                       productName: "Rice",
 *                       pricingType: "quintal",
 *                       actualQty: 5,
 *                       rate: 3000
 *                     }
 *                   ]
 *               Flat Rate Pricing:
 *                 value:
 *                   farmerId: "65f1234567890abcdef12345"
 *                   lines: [{
 *                     productName: "Custom Bundle",
 *                     pricingType: "flat",
 *                     rate: 50000,
 *                     notes: "Fixed price agreement"
 *                   }]
 *     responses:
 *       201:
 *         description: Purchase created successfully
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
 *                   example: "Purchase saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     receiptNumber:
 *                       type: string
 *                       example: "RCP-26-00001"
 *                     farmer:
 *                       type: string
 *                     purchaseDate:
 *                       type: string
 *                     lines:
 *                       type: array
 *                     grossTotal:
 *                       type: number
 *                     totalDeductions:
 *                       type: number
 *                     finalPayable:
 *                       type: number
 *                     amountDue:
 *                       type: number
 *                     status:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Farmer not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, validatePurchase, auditLog('CREATE_PURCHASE', 'Purchase'), ctrl.createPurchase);

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Get all purchases with pagination and filters
 *     tags: [Purchases]
 *     description: Retrieve purchases with filtering by farmer, status, date range, and pagination
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
 *         name: farmerId
 *         schema:
 *           type: string
 *         description: Filter by farmer ID
 *         example: "65f1234567890abcdef12345"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, saved, partial, paid]
 *         description: Filter by payment status
 *         example: "partial"
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
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order by purchase date
 *     responses:
 *       200:
 *         description: Purchases retrieved successfully
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
 *                       receiptNumber:
 *                         type: string
 *                       farmer:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           mobile:
 *                             type: string
 *                       purchaseDate:
 *                         type: string
 *                       grossTotal:
 *                         type: number
 *                       finalPayable:
 *                         type: number
 *                       amountPaid:
 *                         type: number
 *                       amountDue:
 *                         type: number
 *                       status:
 *                         type: string
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
router.get('/', authenticate, validatePagination, ctrl.getAllPurchases);

/**
 * @swagger
 * /api/purchases/summary:
 *   get:
 *     summary: Get purchase summary/report
 *     tags: [Purchases]
 *     description: Get aggregated purchase summary including totals, payments, and dues
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Summary from this date
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Summary until this date
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
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
 *                     totalPurchases:
 *                       type: integer
 *                       description: Total number of purchases
 *                       example: 150
 *                     totalGrossValue:
 *                       type: number
 *                       description: Sum of all gross totals
 *                       example: 2500000
 *                     totalFinalValue:
 *                       type: number
 *                       description: Sum of final payable after deductions
 *                       example: 2350000
 *                     totalPaid:
 *                       type: number
 *                       description: Total amount paid
 *                       example: 2000000
 *                     totalDue:
 *                       type: number
 *                       description: Total amount due
 *                       example: 350000
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/summary', authenticate, ctrl.getPurchaseSummary);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Get purchase by ID with full details
 *     tags: [Purchases]
 *     description: Retrieve complete purchase details including farmer info and all line items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase ID
 *         example: "65f1234567890abcdef12345"
 *     responses:
 *       200:
 *         description: Purchase retrieved successfully
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
 *                     receiptNumber:
 *                       type: string
 *                     farmer:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         mobile:
 *                           type: string
 *                         address:
 *                           type: string
 *                         gstNumber:
 *                           type: string
 *                         bankAccountNumber:
 *                           type: string
 *                         ifscCode:
 *                           type: string
 *                         bankName:
 *                           type: string
 *                     purchaseDate:
 *                       type: string
 *                     lines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productName:
 *                             type: string
 *                           pricingType:
 *                             type: string
 *                           actualQty:
 *                             type: number
 *                           billedQty:
 *                             type: number
 *                           rate:
 *                             type: number
 *                           lineTotal:
 *                             type: number
 *                     deductions:
 *                       type: object
 *                     grossTotal:
 *                       type: number
 *                     totalDeductions:
 *                       type: number
 *                     finalPayable:
 *                       type: number
 *                     amountPaid:
 *                       type: number
 *                     amountDue:
 *                       type: number
 *                     status:
 *                       type: string
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *       404:
 *         description: Purchase not found
 *       401:
 *         description: Not authenticated
 */
router.get('/:id', authenticate, validateIdParam, ctrl.getPurchaseById);

module.exports = router;