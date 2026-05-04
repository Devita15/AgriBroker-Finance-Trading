// src/controllers/ledgerController.js
const LedgerEntry = require('../models/LedgerEntry');
const Farmer = require('../models/Farmer');
const Vendor = require('../models/Vendor');
const ledgerService = require('../services/ledgerService');
const logger = require('../config/logger');

class LedgerController {
  async getFarmerLedger(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;
      
      const farmer = await Farmer.findById(id);
      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }
      
      // Check vendor access
      if (req.user.role === 'vendor') {
        const vendor = await Vendor.findOne({ userId: req.userId });
        if (farmer.vendorId.toString() !== vendor._id.toString()) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
      const ledger = await ledgerService.getFarmerLedger(
        id,
        farmer.vendorId,
        startDate,
        endDate
      );
      
      res.json({
        farmer: {
          id: farmer._id,
          name: farmer.name,
          mobile: farmer.mobile,
        },
        currentBalance: farmer.pendingDues,
        entries: ledger,
      });
    } catch (error) {
      logger.error(`Get farmer ledger error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getExpenseLedger(req, res) {
    try {
      const { vendorId } = req.params;
      
      // Check access
      let targetVendorId = vendorId;
      if (req.user.role === 'vendor') {
        const vendor = await Vendor.findOne({ userId: req.userId });
        targetVendorId = vendor._id.toString();
        if (vendorId && vendorId !== targetVendorId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
      const query = {
        vendorId: targetVendorId,
        ledgerType: 'expense',
      };
      
      const { startDate, endDate } = req.query;
      if (startDate || endDate) {
        query.entryDate = {};
        if (startDate) query.entryDate.$gte = new Date(startDate);
        if (endDate) query.entryDate.$lte = new Date(endDate);
      }
      
      const entries = await LedgerEntry.find(query)
        .sort({ entryDate: 1, createdAt: 1 });
      
      const totalExpenses = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCancellations = entries.reduce((sum, e) => sum + e.credit, 0);
      
      res.json({
        vendorId: targetVendorId,
        currentBalance: entries.length > 0 ? entries[entries.length - 1].runningBalance : 0,
        totalExpenses,
        totalCancellations,
        entries,
      });
    } catch (error) {
      logger.error(`Get expense ledger error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getCombinedLedger(req, res) {
    try {
      const { id } = req.params;
      
      // Check access
      let targetVendorId = id;
      if (req.user.role === 'vendor') {
        const vendor = await Vendor.findOne({ userId: req.userId });
        targetVendorId = vendor._id.toString();
        if (id && id !== targetVendorId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
      const { startDate, endDate } = req.query;
      const entries = await ledgerService.getCombinedLedger(targetVendorId, startDate, endDate);
      
      // Calculate summary
      let totalIn = 0;
      let totalOut = 0;
      
      entries.forEach(entry => {
        if (entry.credit > 0) totalIn += entry.credit;
        if (entry.debit > 0) totalOut += entry.debit;
      });
      
      res.json({
        vendorId: targetVendorId,
        netPosition: totalIn - totalOut,
        totalIn,
        totalOut,
        entries,
      });
    } catch (error) {
      logger.error(`Get combined ledger error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async exportFarmerLedger(req, res) {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;
      
      const farmer = await Farmer.findById(id);
      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }
      
      const ledger = await ledgerService.getFarmerLedger(id, farmer.vendorId);
      
      if (format === 'csv') {
        // Generate CSV
        let csv = 'Date,Description,Debit,Credit,Balance\n';
        ledger.forEach(entry => {
          csv += `${entry.entryDate.toISOString().split('T')[0]},${entry.description},${entry.debit},${entry.credit},${entry.runningBalance}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=farmer_ledger_${farmer.name}_${Date.now()}.csv`);
        return res.send(csv);
      }
      
      res.json(ledger);
    } catch (error) {
      logger.error(`Export farmer ledger error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new LedgerController();