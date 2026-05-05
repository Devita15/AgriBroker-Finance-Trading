// src/routes/paymentRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');
const { validatePayment, validateIdParam } = require('../middleware/validation');
const auditLog   = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Farmer Payment Tracking System - Cash/UPI/Bank/Cheque (Phase 7)
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Record a new payment
 *     tags: [Payments]
 *     description: Record payment against a purchase (supports cash, UPI, bank transfer, and cheque)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purchaseId
 *               - amount
 *               - paymentMode
 *             properties:
 *               purchaseId:
 *                 type: string
 *                 description: ID of the purchase being paid for
 *                 example: "65f1234567890abcdef12345"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Payment amount (will be capped at outstanding dues)
 *                 example: 5000
 *               paymentMode:
 *                 type: string
 *                 enum: [cash, upi, bank, cheque]
 *                 description: Mode of payment
 *                 example: "cash"
 *               referenceNumber:
 *                 type: string
 *                 description: Transaction reference (UPI ID, bank ref, etc.)
 *                 example: "UPI123456789"
 *               paymentDate:
 *                 type: string
 *                 format: date
 *                 description: Date of payment (defaults to current date)
 *                 example: "2026-05-05"
 *               chequeNumber:
 *                 type: string
 *                 description: Cheque number (required if paymentMode is 'cheque')
 *                 example: "123456"
 *               chequeDate:
 *                 type: string
 *                 format: date
 *                 description: Date on cheque
 *                 example: "2026-05-05"
 *               bankName:
 *                 type: string
 *                 description: Bank name (for cheque or bank transfer)
 *                 example: "State Bank of India"
 *               notes:
 *                 type: string
 *                 description: Additional notes
 *                 example: "Payment for wheat purchase"
 *             examples:
 *               Cash Payment:
 *                 value:
 *                   purchaseId: "65f1234567890abcdef12345"
 *                   amount: 5000
 *                   paymentMode: "cash"
 *                   notes: "Cash payment received"
 *               UPI Payment:
 *                 value:
 *                   purchaseId: "65f1234567890abcdef12345"
 *                   amount: 10000
 *                   paymentMode: "upi"
 *                   referenceNumber: "success@ybl"
 *                   notes: "UPI payment received"
 *               Cheque Payment:
 *                 value:
 *                   purchaseId: "65f1234567890abcdef12345"
 *                   amount: 25000
 *                   paymentMode: "cheque"
 *                   chequeNumber: "123456"
 *                   chequeDate: "2026-05-10"
 *                   bankName: "HDFC Bank"
 *                   notes: "Post-dated cheque"
 *     responses:
 *       201:
 *         description: Payment recorded successfully
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
 *                   example: "Payment recorded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     purchase:
 *                       type: string
 *                     farmer:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     paymentMode:
 *                       type: string
 *                     referenceNumber:
 *                       type: string
 *                     paymentDate:
 *                       type: string
 *                     chequeStatus:
 *                       type: string
 *                     chequeNumber:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: Validation error or no outstanding dues
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
 *                   example: "No outstanding dues for this purchase"
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Purchase not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, validatePayment, auditLog('CREATE_PAYMENT', 'Payment'), ctrl.createPayment);

/**
 * @swagger
 * /api/payments/purchase/{purchaseId}:
 *   get:
 *     summary: Get all payments for a specific purchase
 *     tags: [Payments]
 *     description: Retrieve payment history for a specific purchase transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: purchaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Purchase ID
 *         example: "65f1234567890abcdef12345"
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
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
 *                       amount:
 *                         type: number
 *                       paymentMode:
 *                         type: string
 *                       referenceNumber:
 *                         type: string
 *                       paymentDate:
 *                         type: string
 *                       paymentStatus:
 *                         type: string
 *                       createdBy:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/purchase/:purchaseId', authenticate, ctrl.getPaymentsByPurchase);

/**
 * @swagger
 * /api/payments/farmer/{farmerId}:
 *   get:
 *     summary: Get all payments for a specific farmer
 *     tags: [Payments]
 *     description: Retrieve complete payment history for a farmer with pagination
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
 *     responses:
 *       200:
 *         description: Farmer payments retrieved successfully
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
 *                       amount:
 *                         type: number
 *                       paymentMode:
 *                         type: string
 *                       purchase:
 *                         type: object
 *                         properties:
 *                           receiptNumber:
 *                             type: string
 *                           finalPayable:
 *                             type: number
 *                       paymentDate:
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
router.get('/farmer/:farmerId', authenticate, ctrl.getPaymentsByFarmer);

/**
 * @swagger
 * /api/payments/{id}/cheque-status:
 *   patch:
 *     summary: Update cheque status (cleared or bounced)
 *     tags: [Payments]
 *     description: Update the status of a cheque payment after bank clearance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *         example: "65f1234567890abcdef12345"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [cleared, bounced]
 *                 description: New cheque status
 *                 example: "cleared"
 *     responses:
 *       200:
 *         description: Cheque status updated successfully
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
 *                   example: "Cheque marked as cleared"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     chequeStatus:
 *                       type: string
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/cheque-status', authenticate, validateIdParam, auditLog('UPDATE_CHEQUE', 'Payment'), ctrl.updateChequeStatus);

module.exports = router;