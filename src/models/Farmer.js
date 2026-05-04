// src/models/Farmer.js
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  address: String,
  village: String,
  city: String,
  bankAccountNumber: String,
  ifscCode: String,
  bankName: String,
  gstNumber: String,
  totalPurchases: {
    type: Number,
    default: 0,
  },
  totalPaid: {
    type: Number,
    default: 0,
  },
  pendingDues: {
    type: Number,
    default: 0,
  },
  advanceBalance: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Compound index for vendor-mobile uniqueness
farmerSchema.index({ vendorId: 1, mobile: 1 }, { unique: true });

module.exports = mongoose.model('Farmer', farmerSchema);