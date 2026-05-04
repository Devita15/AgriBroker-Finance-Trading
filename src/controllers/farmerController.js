// src/controllers/farmerController.js
const Farmer = require('../models/Farmer');
const FarmerAdvance = require('../models/FarmerAdvance');
const Vendor = require('../models/Vendor');
const ledgerService = require('../services/ledgerService');
const auditService = require('../services/auditService');
const logger = require('../config/logger');

class FarmerController {
  async createFarmer(req, res) {
    try {
      const vendor = await Vendor.findOne({ userId: req.userId });
      if (!vendor && req.user.role === 'vendor') {
        return res.status(403).json({ error: 'Vendor profile not found' });
      }
      
      const vendorId = req.user.role === 'superadmin' || req.user.role === 'operator' 
        ? req.body.vendorId 
        : vendor._id;
      
      const farmerData = {
        ...req.body,
        vendorId,
      };
      
      const farmer = await Farmer.create(farmerData);
      
      await auditService.log(
        req.userId,
        'CREATE_FARMER',
        'Farmer',
        farmer._id,
        null,
        farmer.toObject(),
        null,
        req
      );
      
      res.status(201).json({
        message: 'Farmer registered successfully',
        farmer,
      });
    } catch (error) {
      logger.error(`Create farmer error: ${error.message}`);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Farmer with this mobile number already exists' });
      }
      res.status(500).json({ error: error.message });
    }
  }
  
  async getFarmers(req, res) {
    try {
      const { page = 1, limit = 20, search, isActive } = req.query;
      
      let query = {};
      
      if (req.user.role === 'vendor') {
        const vendor = await Vendor.findOne({ userId: req.userId });
        query.vendorId = vendor._id;
      } else if (req.query.vendorId) {
        query.vendorId = req.query.vendorId;
      }
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { mobile: { $regex: search, $options: 'i' } },
        ];
      }
      
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      
      const farmers = await Farmer.find(query)
        .populate('vendorId', 'businessName')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Farmer.countDocuments(query);
      
      res.json({
        farmers,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      logger.error(`Get farmers error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getFarmerById(req, res) {
    try {
      const farmer = await Farmer.findById(req.params.id)
        .populate('vendorId', 'businessName');
      
      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }
      
      // Check vendor access
      if (req.user.role === 'vendor') {
        const vendor = await Vendor.findOne({ userId: req.userId });
        if (farmer.vendorId._id.toString() !== vendor._id.toString()) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      
      res.json(farmer);
    } catch (error) {
      logger.error(`Get farmer error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getFarmerSummary(req, res) {
    try {
      const farmer = await Farmer.findById(req.params.id);
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
      
      res.json({
        farmerId: farmer._id,
        name: farmer.name,
        totalPurchases: farmer.totalPurchases,
        totalPaid: farmer.totalPaid,
        pendingDues: farmer.pendingDues,
        advanceBalance: farmer.advanceBalance,
      });
    } catch (error) {
      logger.error(`Get farmer summary error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async updateFarmer(req, res) {
    try {
      const farmer = await Farmer.findById(req.params.id);
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
      
      const beforeValue = farmer.toObject();
      const updatedFarmer = await Farmer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      
      await auditService.log(
        req.userId,
        'UPDATE_FARMER',
        'Farmer',
        farmer._id,
        beforeValue,
        updatedFarmer.toObject(),
        null,
        req
      );
      
      res.json({
        message: 'Farmer updated successfully',
        farmer: updatedFarmer,
      });
    } catch (error) {
      logger.error(`Update farmer error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async giveAdvance(req, res) {
    try {
      const { amount, paymentMode, referenceNumber, notes } = req.body;
      
      const farmer = await Farmer.findById(req.params.id);
      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }
      
      // Check vendor access
      let vendor;
      if (req.user.role === 'vendor') {
        vendor = await Vendor.findOne({ userId: req.userId });
        if (farmer.vendorId.toString() !== vendor._id.toString()) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else {
        vendor = await Vendor.findById(farmer.vendorId);
      }
      
      // Create advance record
      const advance = await FarmerAdvance.create({
        farmerId: farmer._id,
        vendorId: farmer.vendorId,
        amount,
        paymentMode,
        referenceNumber,
        notes,
        givenBy: req.userId,
      });
      
      // Update farmer advance balance
      farmer.advanceBalance += amount;
      await farmer.save();
      
      // Add ledger entry
      await ledgerService.addFarmerLedgerEntry({
        vendorId: farmer.vendorId,
        farmerId: farmer._id,
        description: `Advance given to ${farmer.name} - ${paymentMode.toUpperCase()}`,
        referenceId: advance._id,
        referenceType: 'advance',
        debit: amount,
        credit: 0,
      });
      
      await auditService.log(
        req.userId,
        'GIVE_ADVANCE',
        'FarmerAdvance',
        advance._id,
        null,
        advance.toObject(),
        notes,
        req
      );
      
      res.status(201).json({
        message: 'Advance given successfully',
        advance,
        advanceBalance: farmer.advanceBalance,
      });
    } catch (error) {
      logger.error(`Give advance error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getAdvanceHistory(req, res) {
    try {
      const farmer = await Farmer.findById(req.params.id);
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
      
      const advances = await FarmerAdvance.find({ farmerId: farmer._id })
        .sort({ createdAt: -1 })
        .populate('givenBy', 'name');
      
      res.json(advances);
    } catch (error) {
      logger.error(`Get advance history error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getFarmerDues(req, res) {
    try {
      const farmer = await Farmer.findById(req.params.id);
      if (!farmer) {
        return res.status(404).json({ error: 'Farmer not found' });
      }
      
      res.json({
        farmerId: farmer._id,
        name: farmer.name,
        pendingDues: farmer.pendingDues,
        totalPurchases: farmer.totalPurchases,
        totalPaid: farmer.totalPaid,
      });
    } catch (error) {
      logger.error(`Get farmer dues error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new FarmerController();