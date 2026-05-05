// src/routes/saleRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/saleController');
const authenticate = require('../middleware/auth');
const { validateSale, validateIdParam, validatePagination } = require('../middleware/validation');
const auditLog   = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Sales & Invoice Generation with Inventory Management (Phase 11)
 */

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale invoice
 *     tags: [Sales]
 *     description: Generate sales invoice, reduce inventory, and calculate GST automatically
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerName
 *               - lines
 *             properties:
 *               buyerName:
 *                 type: string
 *                 description: Name of the buyer/customer
 *                 example: "ABC Traders"
 *               buyerMobile:
 *                 type: string
 *                 description: Buyer's mobile number
 *                 example: "9988776655"
 *               buyerGst:
 *                 type: string
 *                 description: Buyer's GST number (if applicable)
 *                 example: "27AAAAA0000A1Z"
 *               saleDate:
 *                 type: string
 *                 format: date
 *                 description: Date of sale (defaults to current date)
 *                 example: "2026-05-05"
 *               lines:
 *                 type: array
 *                 description: Products sold
 *                 items:
 *                   type: object
 *                   required:
 *                     - productName
 *                     - qty
 *                     - sellingPrice
 *                   properties:
 *                     productName:
 *                       type: string
 *                       description: Name of the product
 *                       example: "Wheat"
 *                     warehouse:
 *                       type: string
 *                       description: Warehouse to take stock from
 *                       default: "Main Warehouse"
 *                       example: "Main Warehouse"
 *                     qty:
 *                       type: number
 *                       description: Quantity sold
 *                       example: 100
 *                     sellingPrice:
 *                       type: number
 *                       description: Selling price per unit
 *                       example: 2500
 *               gstPercent:
 *                 type: number
 *                 description: GST percentage (0, 5, 12, 18, 28)
 *                 default: 0
 *                 example: 18
 *               paymentMode:
 *                 type: string
 *                 enum: [cash, upi, bank, cheque, credit]
 *                 description: Mode of payment
 *                 default: cash
 *                 example: "cash"
 *               referenceNumber:
 *                 type: string
 *                 description: Transaction reference (UPI ID, cheque number, etc.)
 *                 example: "UPI123456789"
 *               notes:
 *                 type: string
 *                 description: Additional notes about the sale
 *                 example: "Bulk order discount applied"
 *             examples:
 *               Cash Sale - Single Product:
 *                 value:
 *                   buyerName: "ABC Traders"
 *                   buyerMobile: "9988776655"
 *                   saleDate: "2026-05-05"
 *                   lines: [{
 *                     productName: "Wheat",
 *                     warehouse: "Main Warehouse",
 *                     qty: 100,
 *                     sellingPrice: 2500
 *                   }]
 *                   gstPercent: 18
 *                   paymentMode: "cash"
 *               Multi-Product Sale:
 *                 value:
 *                   buyerName: "XYZ Enterprises"
 *                   buyerMobile: "9876543210"
 *                   lines: [
 *                     {
 *                       productName: "Wheat",
 *                       qty: 50,
 *                       sellingPrice: 2600
 *                     },
 *                     {
 *                       productName: "Rice",
 *                       qty: 30,
 *                       sellingPrice: 3500
 *                     }
 *                   ]
 *                   gstPercent: 12
 *                   paymentMode: "bank"
 *                   referenceNumber: "NEFT123456"
 *               Credit Sale:
 *                 value:
 *                   buyerName: "Wholesale Mart"
 *                   buyerMobile: "8887776665"
 *                   buyerGst: "27AAAAA0000A1Z"
 *                   lines: [{
 *                     productName: "Corn",
 *                     qty: 200,
 *                     sellingPrice: 2200
 *                   }]
 *                   gstPercent: 5
 *                   paymentMode: "credit"
 *                   notes: "30 days credit period"
 *     responses:
 *       201:
 *         description: Sale recorded successfully
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
 *                   example: "Sale recorded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     invoiceNumber:
 *                       type: string
 *                       example: "INV-26-00001"
 *                     buyerName:
 *                       type: string
 *                     saleDate:
 *                       type: string
 *                     lines:
 *                       type: array
 *                     subTotal:
 *                       type: number
 *                     gstPercent:
 *                       type: number
 *                     gstAmount:
 *                       type: number
 *                     grandTotal:
 *                       type: number
 *                     paymentMode:
 *                       type: string
 *                     invoiceNumber:
 *                       type: string
 *       400:
 *         description: Validation error or insufficient stock
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Insufficient stock for 'Wheat' in Main Warehouse. Available: 50"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, validateSale, auditLog('CREATE_SALE', 'Sale'), ctrl.createSale);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales invoices
 *     tags: [Sales]
 *     description: Retrieve sales invoices with pagination and date filtering
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales from this date
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter sales until this date
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Sales retrieved successfully
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
 *                       invoiceNumber:
 *                         type: string
 *                       buyerName:
 *                         type: string
 *                       saleDate:
 *                         type: string
 *                       subTotal:
 *                         type: number
 *                       grandTotal:
 *                         type: number
 *                       paymentMode:
 *                         type: string
 *                       createdBy:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
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
router.get('/', authenticate, validatePagination, ctrl.getAllSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale invoice by ID
 *     tags: [Sales]
 *     description: Retrieve complete sale invoice details including all line items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sale ID
 *         example: "65f1234567890abcdef12345"
 *     responses:
 *       200:
 *         description: Sale retrieved successfully
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
 *                     invoiceNumber:
 *                       type: string
 *                     buyerName:
 *                       type: string
 *                     buyerMobile:
 *                       type: string
 *                     buyerGst:
 *                       type: string
 *                     saleDate:
 *                       type: string
 *                       format: date-time
 *                     lines:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productName:
 *                             type: string
 *                           warehouse:
 *                             type: string
 *                           qty:
 *                             type: number
 *                           unit:
 *                             type: string
 *                           sellingPrice:
 *                             type: number
 *                           lineTotal:
 *                             type: number
 *                     subTotal:
 *                       type: number
 *                     gstPercent:
 *                       type: number
 *                     gstAmount:
 *                       type: number
 *                     grandTotal:
 *                       type: number
 *                     paymentMode:
 *                       type: string
 *                     referenceNumber:
 *                       type: string
 *                     notes:
 *                       type: string
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *       404:
 *         description: Sale not found
 *       401:
 *         description: Not authenticated
 */
router.get('/:id', authenticate, validateIdParam, ctrl.getSaleById);

module.exports = router;