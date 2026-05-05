// src/models/AuditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action:       { type: String, required: true },
    entityType:   { type: String, required: true },
    entityId:     { type: mongoose.Schema.Types.ObjectId, default: null },
    beforeValue:  { type: mongoose.Schema.Types.Mixed, default: null },
    afterValue:   { type: mongoose.Schema.Types.Mixed, default: null },
    ipAddress:    { type: String, default: '' },
    deviceInfo:   { type: String, default: '' },
    notes:        { type: String, default: '' },
  },
  {
    timestamps: true,
    // Immutable — no updates allowed
  }
);

// Prevent any updates to audit logs
auditLogSchema.pre('findOneAndUpdate', function () {
  throw new Error('Audit logs are immutable');
});
auditLogSchema.pre('updateOne', function () {
  throw new Error('Audit logs are immutable');
});
auditLogSchema.pre('updateMany', function () {
  throw new Error('Audit logs are immutable');
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ entityType: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
