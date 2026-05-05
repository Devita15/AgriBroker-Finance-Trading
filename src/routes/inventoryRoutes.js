// src/routes/inventoryRoutes.js
const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/inventoryController');
const authenticate = require('../middleware/auth');
const auditLog   = require('../middleware/auditLogger');

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Real-time Stock Management System - Phase 10
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     description: Retrieve complete inventory list with optional filtering by warehouse, search, and low stock alerts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: warehouse
 *         schema:
 *           type: string
 *         description: Filter by warehouse name
 *         example: "Main Warehouse"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search products by name (case-insensitive)
 *         example: "wheat"
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Show only products with stock ≤ 10 units
 *         example: true
 *     responses:
 *       200:
 *         description: Inventory retrieved successfully
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
 *                       productName:
 *                         type: string
 *                         example: "Wheat"
 *                       warehouse:
 *                         type: string
 *                         example: "Main Warehouse"
 *                       currentStock:
 *                         type: number
 *                         example: 1500
 *                       unit:
 *                         type: string
 *                         example: "kg"
 *                       lastUpdated:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, ctrl.getAllInventory);

/**
 * @swagger
 * /api/inventory/product/{productName}:
 *   get:
 *     summary: Get stock for a specific product across all warehouses
 *     tags: [Inventory]
 *     description: Retrieve stock levels for a product in all warehouses (supports partial name search)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productName
 *         required: true
 *         schema:
 *           type: string
 *         description: Product name (case-insensitive, partial match supported)
 *         example: "Wheat"
 *     responses:
 *       200:
 *         description: Product stock retrieved successfully
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
 *                       productName:
 *                         type: string
 *                       warehouse:
 *                         type: string
 *                       currentStock:
 *                         type: number
 *                       unit:
 *                         type: string
 *                       lastUpdated:
 *                         type: string
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/product/:productName', authenticate, ctrl.getProductStock);

/**
 * @swagger
 * /api/inventory/adjust:
 *   post:
 *     summary: Adjust stock level (add or remove)
 *     tags: [Inventory]
 *     description: Increase or decrease stock quantity for a product in a specific warehouse
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - adjustment
 *               - reason
 *             properties:
 *               productName:
 *                 type: string
 *                 description: Name of the product
 *                 example: "Wheat"
 *               warehouse:
 *                 type: string
 *                 description: Warehouse name (defaults to "Main Warehouse")
 *                 example: "Main Warehouse"
 *               adjustment:
 *                 type: number
 *                 description: "Positive number to add stock, negative to remove stock"
 *                 example: 100
 *               reason:
 *                 type: string
 *                 description: "Reason for stock adjustment (mandatory for audit trail)"
 *                 example: "New harvest received"
 *             examples:
 *               Add Stock:
 *                 value:
 *                   productName: "Wheat"
 *                   warehouse: "Main Warehouse"
 *                   adjustment: 500
 *                   reason: "New crop procurement"
 *               Remove Stock:
 *                 value:
 *                   productName: "Rice"
 *                   warehouse: "Secondary Warehouse"
 *                   adjustment: -50
 *                   reason: "Damaged stock disposal"
 *     responses:
 *       200:
 *         description: Stock adjusted successfully
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
 *                   example: "Stock adjusted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     productName:
 *                       type: string
 *                     warehouse:
 *                       type: string
 *                     currentStock:
 *                       type: number
 *                       example: 1600
 *                     unit:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *       400:
 *         description: "Validation error - missing reason or negative stock would result"
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
 *                   example: "Reason is required for stock adjustment"
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Product not found in inventory
 *       500:
 *         description: Server error
 */
router.post('/adjust', authenticate, auditLog('ADJUST_STOCK', 'Inventory'), ctrl.adjustStock);

/**
 * @swagger
 * /api/inventory/transfer:
 *   post:
 *     summary: Transfer stock between warehouses
 *     tags: [Inventory]
 *     description: Move specified quantity of a product from one warehouse to another
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - fromWarehouse
 *               - toWarehouse
 *               - qty
 *             properties:
 *               productName:
 *                 type: string
 *                 description: Name of the product to transfer
 *                 example: "Wheat"
 *               fromWarehouse:
 *                 type: string
 *                 description: Source warehouse name
 *                 example: "Main Warehouse"
 *               toWarehouse:
 *                 type: string
 *                 description: Destination warehouse name
 *                 example: "Secondary Warehouse"
 *               qty:
 *                 type: number
 *                 description: Quantity to transfer (must be positive)
 *                 example: 200
 *     responses:
 *       200:
 *         description: Stock transferred successfully
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
 *                   example: "Stock transferred successfully"
 *       400:
 *         description: "Validation error - insufficient stock, same warehouse, or missing fields"
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
 *                   example: "Insufficient stock in Main Warehouse"
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Source product not found
 *       500:
 *         description: Server error
 */
router.post('/transfer', authenticate, auditLog('TRANSFER_STOCK', 'Inventory'), ctrl.transferStock);

module.exports = router;