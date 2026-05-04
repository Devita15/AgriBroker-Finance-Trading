// src/middleware/auditLogger.js
const AuditLog = require('../models/AuditLog');

const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    const oldSend = res.send;
    
    res.send = function(data) {
      // Store the original response
      const responseData = data;
      
      // Create audit log entry
      const auditEntry = {
        userId: req.userId,
        action: action,
        entityType: entityType,
        entityId: req.params.id || req.body._id,
        beforeValue: req.originalEntity, // Set by controller
        afterValue: req.body,
        ipAddress: req.ip,
        deviceInfo: req.headers['user-agent'],
        notes: req.body.notes || req.query.reason,
      };
      
      // Async save audit log (don't wait for response)
      AuditLog.create(auditEntry).catch(err => 
        console.error('Audit log error:', err)
      );
      
      oldSend.apply(res, arguments);
    };
    
    next();
  };
};

module.exports = auditLog;