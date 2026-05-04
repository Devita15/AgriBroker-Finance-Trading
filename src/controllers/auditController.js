// src/controllers/auditController.js
const auditService = require('../services/auditService');
const logger = require('../config/logger');

class AuditController {
  async getAuditLogs(req, res) {
    try {
      // Only superadmin and operator can view audit logs
      if (req.user.role !== 'superadmin' && req.user.role !== 'operator') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const { page = 1, limit = 50, startDate, endDate, action, entityType, userId } = req.query;
      
      const filters = {
        startDate,
        endDate,
        action,
        entityType,
        userId,
      };
      
      const logs = await auditService.getAuditLogs(filters);
      
      const paginatedLogs = logs.slice((page - 1) * limit, page * limit);
      
      res.json({
        logs: paginatedLogs,
        total: logs.length,
        page: parseInt(page),
        pages: Math.ceil(logs.length / limit),
      });
    } catch (error) {
      logger.error(`Get audit logs error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
  
  async getAuditLogById(req, res) {
    try {
      if (req.user.role !== 'superadmin' && req.user.role !== 'operator') {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const AuditLog = require('../models/AuditLog');
      const log = await AuditLog.findById(req.params.id).populate('userId', 'name email role');
      
      if (!log) {
        return res.status(404).json({ error: 'Audit log not found' });
      }
      
      res.json(log);
    } catch (error) {
      logger.error(`Get audit log error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AuditController();