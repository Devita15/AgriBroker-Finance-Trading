// src/services/ledgerService.js
const LedgerEntry = require('../models/LedgerEntry');
const Farmer = require('../models/Farmer');
const Purchase = require('../models/Purchase');
const logger = require('../config/logger');
class LedgerService {
  async addFarmerLedgerEntry({ vendorId, farmerId, description, referenceId, referenceType, debit = 0, credit = 0 }) {
    try {
      const lastEntry = await LedgerEntry.findOne({
        vendorId,
        farmerId,
        ledgerType: 'farmer'
      }).sort({ entryDate: -1, createdAt: -1 });
      const previousBalance = lastEntry ? lastEntry.runningBalance : 0;
      const newBalance = previousBalance + credit - debit;
      const ledgerEntry = await LedgerEntry.create({
        vendorId,
        ledgerType: 'farmer',
        farmerId,
        description,
        referenceId,
        referenceType,
        debit,
        credit,
        runningBalance: newBalance,
      });
      
      // Update farmer's computed fields
      const farmer = await Farmer.findById(farmerId);
      if (farmer) {
        if (referenceType === 'purchase') {
          farmer.totalPurchases += credit;
          farmer.pendingDues = newBalance;
        } else if (referenceType === 'payment') {
          farmer.totalPaid += debit;
          farmer.pendingDues = newBalance;
        }
        await farmer.save();
      }
      
      return ledgerEntry;
    } catch (error) {
      logger.error(`Ledger service error: ${error.message}`);
      throw error;
    }
  }
  
  async getFarmerLedger(farmerId, vendorId, startDate, endDate) {
    const query = {
      farmerId,
      vendorId,
      ledgerType: 'farmer',
    };
    
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }
    
    return await LedgerEntry.find(query)
      .sort({ entryDate: 1, createdAt: 1 });
  }
  
  async addExpenseLedgerEntry({ vendorId, description, referenceId, amount, isCancellation = false }) {
    const lastEntry = await LedgerEntry.findOne({
      vendorId,
      ledgerType: 'expense'
    }).sort({ entryDate: -1, createdAt: -1 });
    
    const previousBalance = lastEntry ? lastEntry.runningBalance : 0;
    
    if (isCancellation) {
      // Credit (reversal) for expense cancellation
      const newBalance = previousBalance + amount;
      return await LedgerEntry.create({
        vendorId,
        ledgerType: 'expense',
        description: `CANCELLED: ${description}`,
        referenceId,
        referenceType: 'expense_reversal',
        credit: amount,
        runningBalance: newBalance,
      });
    } else {
      // Debit for expense
      const newBalance = previousBalance - amount;
      return await LedgerEntry.create({
        vendorId,
        ledgerType: 'expense',
        description,
        referenceId,
        referenceType: 'expense',
        debit: amount,
        runningBalance: newBalance,
      });
    }
  }
  
  async getCombinedLedger(vendorId, startDate, endDate) {
    const query = {
      vendorId,
      ledgerType: 'combined',
    };
    
    if (startDate || endDate) {
      query.entryDate = {};
      if (startDate) query.entryDate.$gte = new Date(startDate);
      if (endDate) query.entryDate.$lte = new Date(endDate);
    }
    
    return await LedgerEntry.find(query).sort({ entryDate: 1 });
  }
}

module.exports = new LedgerService();