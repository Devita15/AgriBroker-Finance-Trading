const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Farmers
 *   description: Farmer management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Farmer:
 *       type: object
 *       required:
 *         - name
 *         - mobile
 *       properties:
 *         name:
 *           type: string
 *           example: Ram Yadav
 *         mobile:
 *           type: string
 *           example: +919876543210
 *         address:
 *           type: string
 *           example: "123 Village Road"
 *         village:
 *           type: string
 *           example: Shirur
 *         city:
 *           type: string
 *           example: Pune
 *         bankAccountNumber:
 *           type: string
 *           example: "1234567890"
 *         ifscCode:
 *           type: string
 *           example: "SBIN0012345"
 *         bankName:
 *           type: string
 *           example: "State Bank of India"
 *         gstNumber:
 *           type: string
 *           example: "27AAAAA0000A1Z"
 */

/**
 * @swagger
 * /farmers:
 *   get:
 *     summary: Get all farmers
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of farmers
 */
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Farmers list endpoint',
    data: {
      farmers: [],
      total: 0,
      page: 1,
      pages: 0
    }
  });
});

/**
 * @swagger
 * /farmers:
 *   post:
 *     summary: Create a new farmer
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Farmer'
 *     responses:
 *       201:
 *         description: Farmer created successfully
 */
router.post('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Create farmer endpoint',
    example: {
      name: "Ram Yadav",
      mobile: "+919876543210",
      address: "123 Village Road",
      village: "Shirur",
      city: "Pune"
    }
  });
});

/**
 * @swagger
 * /farmers/{id}:
 *   get:
 *     summary: Get farmer by ID
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Farmer details
 *       404:
 *         description: Farmer not found
 */
router.get('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Get farmer ${req.params.id}`,
    data: {
      id: req.params.id,
      name: "Ram Yadav",
      mobile: "+919876543210"
    }
  });
});

/**
 * @swagger
 * /farmers/{id}:
 *   put:
 *     summary: Update farmer
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Farmer'
 *     responses:
 *       200:
 *         description: Farmer updated
 */
router.put('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Update farmer ${req.params.id}` 
  });
});

/**
 * @swagger
 * /farmers/{id}/summary:
 *   get:
 *     summary: Get farmer summary with stats
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Farmer summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 farmerId: { type: string }
 *                 name: { type: string }
 *                 totalPurchases: { type: number }
 *                 totalPaid: { type: number }
 *                 pendingDues: { type: number }
 *                 advanceBalance: { type: number }
 */
router.get('/:id/summary', (req, res) => {
  res.json({ 
    success: true, 
    message: `Farmer summary for ${req.params.id}`,
    data: {
      farmerId: req.params.id,
      name: "Ram Yadav",
      totalPurchases: 250000,
      totalPaid: 150000,
      pendingDues: 100000,
      advanceBalance: 5000
    }
  });
});

/**
 * @swagger
 * /farmers/{id}/advance:
 *   post:
 *     summary: Give advance to farmer
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMode
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *               paymentMode:
 *                 type: string
 *                 enum: [cash, upi, bank, cheque]
 *               referenceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Advance given successfully
 */
router.post('/:id/advance', (req, res) => {
  res.json({ 
    success: true, 
    message: `Give advance to farmer ${req.params.id}`,
    example: {
      amount: 5000,
      paymentMode: "cash",
      referenceNumber: "REF123",
      notes: "Pre-harvest advance"
    }
  });
});

/**
 * @swagger
 * /farmers/{id}/advance:
 *   get:
 *     summary: Get advance history
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Advance history
 */
router.get('/:id/advance', (req, res) => {
  res.json({ 
    success: true, 
    message: `Advance history for farmer ${req.params.id}`,
    advances: []
  });
});

/**
 * @swagger
 * /farmers/{id}/dues:
 *   get:
 *     summary: Get farmer pending dues
 *     tags: [Farmers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Pending dues
 */
router.get('/:id/dues', (req, res) => {
  res.json({ 
    success: true, 
    message: `Dues for farmer ${req.params.id}`,
    data: {
      farmerId: req.params.id,
      pendingDues: 100000
    }
  });
});

module.exports = router;