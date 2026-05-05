// src/routes/auditRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/auditController');
const authenticate = require('../middleware/auth');
const { validateIdParam, validatePagination } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Immutable audit log tracking - Phase 14
 */

/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get audit logs (read-only, immutable)
 *     tags: [Audit]
 *     description: Retrieve system audit logs with filtering and pagination
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
 *           default: 50
 *         description: Items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, REGISTER, EXPORT, IMPORT]
 *         description: Filter by action type
 *         example: "LOGIN"
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [User, Farmer, Purchase, Sale, Payment, Expense, Inventory, Report]
 *         description: Filter by entity type
 *         example: "Farmer"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *         example: "65f1234567890abcdef12345"
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs from this date (YYYY-MM-DD)
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter logs until this date (YYYY-MM-DD)
 *         example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
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
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       action:
 *                         type: string
 *                       entityType:
 *                         type: string
 *                       entityId:
 *                         type: string
 *                       beforeValue:
 *                         type: object
 *                       afterValue:
 *                         type: object
 *                       ipAddress:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
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
router.get('/', authenticate, validatePagination, ctrl.getAuditLogs);

/**
 * @swagger
 * /api/audit/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     description: Retrieve a single audit log entry by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit log ID
 *         example: "65f1234567890abcdef12345"
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
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
 *                     userId:
 *                       type: object
 *                     action:
 *                       type: string
 *                     entityType:
 *                       type: string
 *                     entityId:
 *                       type: string
 *                     beforeValue:
 *                       type: object
 *                     afterValue:
 *                       type: object
 *                     ipAddress:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Audit log not found
 */
router.get('/:id', authenticate, validateIdParam, ctrl.getAuditLogById);

module.exports = router;