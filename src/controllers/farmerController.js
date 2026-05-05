// src/controllers/farmerController.js
const Farmer  = require('../models/Farmer');
const Ledger  = require('../models/Ledger');
const logger  = require('../config/logger');

// ── Helpers ──────────────────────────────────────────────────────────────────

const buildPagination = (page = 1, limit = 20, total) => ({
  page: Number(page),
  limit: Number(limit),
  total,
  pages: Math.ceil(total / limit),
});

// ── Controllers ───────────────────────────────────────────────────────────────

exports.createFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.create({ ...req.body, createdBy: req.userId });
    logger.info(`Farmer created: ${farmer.name} by ${req.user.email}`);
    res.status(201).json({ success: true, message: 'Farmer registered successfully', data: farmer });
  } catch (error) {
    logger.error(`Create farmer error: ${error.message}`);
    if (error.code === 11000) return res.status(409).json({ success: false, error: 'Farmer with this mobile already exists' });
    res.status(500).json({ success: false, error: 'Failed to register farmer' });
  }
};

exports.getAllFarmers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'desc', isActive } = req.query;

    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { village: { $regex: search, $options: 'i' } },
    ];
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [farmers, total] = await Promise.all([
      Farmer.find(filter).sort(sort).skip(skip).limit(Number(limit)).select('-__v'),
      Farmer.countDocuments(filter),
    ]);

    res.json({ success: true, data: farmers, pagination: buildPagination(page, limit, total) });
  } catch (error) {
    logger.error(`Get farmers error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch farmers' });
  }
};

exports.getFarmerById = async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, data: farmer });
  } catch (error) {
    logger.error(`Get farmer error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch farmer' });
  }
};

exports.updateFarmer = async (req, res) => {
  try {
    // Protect summary fields from manual update
    const disallowed = ['totalPurchases', 'totalPurchaseValue', 'totalPaid', 'pendingDues', 'advanceBalance', 'createdBy'];
    disallowed.forEach(f => delete req.body[f]);

    const farmer = await Farmer.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });

    logger.info(`Farmer updated: ${farmer.name} by ${req.user.email}`);
    res.json({ success: true, message: 'Farmer updated successfully', data: farmer });
  } catch (error) {
    logger.error(`Update farmer error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to update farmer' });
  }
};

exports.deactivateFarmer = async (req, res) => {
  try {
    const farmer = await Farmer.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });
    res.json({ success: true, message: 'Farmer deactivated', data: farmer });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate farmer' });
  }
};

exports.getFarmerLedger = async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    const filter = { farmer: req.params.id };
    if (startDate || endDate) {
      filter.entryDate = {};
      if (startDate) filter.entryDate.$gte = new Date(startDate);
      if (endDate)   filter.entryDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [entries, total, farmer] = await Promise.all([
      Ledger.find(filter).sort({ entryDate: -1 }).skip(skip).limit(Number(limit)).populate('createdBy', 'name email'),
      Ledger.countDocuments(filter),
      Farmer.findById(req.params.id).select('name mobile pendingDues advanceBalance'),
    ]);

    if (!farmer) return res.status(404).json({ success: false, error: 'Farmer not found' });

    res.json({
      success: true,
      farmer,
      data: entries,
      pagination: buildPagination(page, limit, total),
    });
  } catch (error) {
    logger.error(`Get ledger error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch ledger' });
  }
};
