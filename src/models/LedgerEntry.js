// src/models/LedgerEntry.js
const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true,
  },
  ledgerType: {
    type: String,
    enum: ['farmer', 'expense', 'combined'],
    required: true,
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
  },
  entryDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
    required: true,
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceType: {
    type: String,
    enum: ['purchase', 'payment', 'advance', 'expense', 'sale', 'expense_reversal'],
  },
  debit: {
    type: Number,
    default: 0,
  },
  credit: {
    type: Number,
    default: 0,
  },
  runningBalance: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ledgerEntrySchema.index({ vendorId: 1, farmerId: 1, entryDate: -1 });
ledgerEntrySchema.index({ ledgerType: 1, entryDate: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);