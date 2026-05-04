// src/models/FarmerAdvance.js
const mongoose = require('mongoose');

const farmerAdvanceSchema = new mongoose.Schema({
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'bank', 'cheque'],
    required: true,
  },
  referenceNumber: String,
  notes: String,
  givenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isAdjusted: {
    type: Boolean,
    default: false,
  },
  adjustedInPurchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FarmerAdvance', farmerAdvanceSchema);