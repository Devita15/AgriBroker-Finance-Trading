// src/controllers/auditController.js
const AuditLog = require('../models/AuditLog');
const logger   = require('../config/logger');

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate, action, entityType, userId } = req.query;

    const filter = {};
    if (action)     filter.action     = action;
    if (entityType) filter.entityType = entityType;
    if (userId)     filter.userId     = userId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('userId', 'name email role'),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ success: true, data: logs, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error(`Get audit logs error: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
};

exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('userId', 'name email role');
    if (!log) return res.status(404).json({ success: false, error: 'Audit log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit log' });
  }
};
