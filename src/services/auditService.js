// src/services/auditService.js
const AuditLog = require('../models/AuditLog');
const logger = require('../config/logger');

class AuditService {
  async log(userId, action, entityType, entityId, beforeValue = null, afterValue = null, notes = null, req = null) {
    try {
      const auditEntry = {
        userId,
        action,
        entityType,
        entityId,
        beforeValue,
        afterValue,
        notes,
      };
      
      if (req) {
        auditEntry.ipAddress = req.ip;
        auditEntry.deviceInfo = req.headers['user-agent'];
      }
      
      await AuditLog.create(auditEntry);
    } catch (error) {
      logger.error(`Audit log failed: ${error.message}`);
      // Don't throw, just log the error
    }
  }
  
  async getAuditLogs(filters = {}) {
    const query = {};
    
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }
    
    return await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
  }
}

module.exports = new AuditService();