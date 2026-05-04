const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ledger
 *   description: Ledger management
 */

/**
 * @swagger
 * /ledger/farmer/{id}:
 *   get:
 *     summary: Get farmer ledger
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Farmer ledger entries
 */
router.get('/farmer/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Farmer ledger for ${req.params.id}`,
    data: {
      farmer: { id: req.params.id, name: "Ram Yadav" },
      currentBalance: 100000,
      entries: [
        {
          date: "2024-01-15",
          description: "Purchase PUR-001",
          debit: 0,
          credit: 225750,
          runningBalance: 225750
        },
        {
          date: "2024-01-15",
          description: "Payment - Cash",
          debit: 50000,
          credit: 0,
          runningBalance: 175750
        }
      ]
    }
  });
});

/**
 * @swagger
 * /ledger/farmer/{id}/export:
 *   get:
 *     summary: Export farmer ledger
 *     tags: [Ledger]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [json, csv], default: json }
 *     responses:
 *       200:
 *         description: Exported ledger
 */
router.get('/farmer/:id/export', (req, res) => {
  res.json({ message: `Export farmer ledger ${req.params.id}` });
});

/**
 * @swagger
 * /ledger/expenses/{vendorId}:
 *   get:
 *     summary: Get expense ledger
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *     responses:
 *       200:
 *         description: Expense ledger
 */
router.get('/expenses/:vendorId', (req, res) => {
  res.json({ 
    success: true, 
    message: `Expense ledger for vendor ${req.params.vendorId}`,
    entries: []
  });
});

/**
 * @swagger
 * /ledger/vendor/{id}:
 *   get:
 *     summary: Get combined vendor ledger
 *     tags: [Ledger]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Combined ledger
 */
router.get('/vendor/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Combined ledger for vendor ${req.params.id}`,
    data: {
      netPosition: 50000,
      totalIn: 500000,
      totalOut: 450000
    }
  });
});

module.exports = router;