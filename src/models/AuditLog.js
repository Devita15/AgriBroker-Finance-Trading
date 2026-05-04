// src/models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  entityType: {
    type: String,
    required: true,
  },
  entityId: mongoose.Schema.Types.ObjectId,
  beforeValue: mongoose.Schema.Types.Mixed,
  afterValue: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  deviceInfo: String,
  notes: String,
}, {
  timestamps: true,
  // Ensure no updates are allowed
  strict: true,
});

// Prevent updates
auditLogSchema.pre('save', function(next) {
  if (this.isModified('createdAt')) {
    return next(new Error('Cannot modify audit log'));
  }
  next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);