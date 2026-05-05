// src/middleware/auditLogger.js
const AuditLog = require('../models/AuditLog');

/**
 * Middleware factory that logs actions to the immutable AuditLog.
 * Usage: router.post('/path', authenticate, auditLog('CREATE', 'Purchase'), controller)
 */
const auditLog = (action, entityType) => async (req, res, next) => {
  const originalSend = res.json.bind(res);

  res.json = function (body) {
    // Only log on successful responses
    if (res.statusCode >= 200 && res.statusCode < 300) {
      AuditLog.create({
        userId:     req.userId || null,
        action,
        entityType,
        entityId:   req.params?.id || body?.data?._id || body?._id || null,
        beforeValue: req.originalEntity || null,
        afterValue:  req.body || null,
        ipAddress:   req.ip,
        deviceInfo:  req.headers['user-agent'] || '',
        notes:       req.body?.notes || req.query?.reason || '',
      }).catch(err => console.error('Audit log write error:', err.message));
    }
    return originalSend(body);
  };

  next();
};

module.exports = auditLog;
