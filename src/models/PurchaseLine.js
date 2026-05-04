// src/models/PurchaseLine.js
const mongoose = require('mongoose');

const purchaseLineSchema = new mongoose.Schema({
  purchaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Purchase',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  pricingType: {
    type: String,
    enum: ['kg', 'quintal', 'piece', 'bunch', 'crate', 'dozen', 'flat'],
    required: true,
  },
  bagsCount: Number,
  weightPerBag: Number,
  actualQty: {
    type: Number,
    required: true,
  },
  actualQtyUnit: String,
  qualityDeductionQty: {
    type: Number,
    default: 0,
  },
  billedQty: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  lineTotal: {
    type: Number,
    required: true,
  },
  isRateLocked: {
    type: Boolean,
    default: false,
  },
  rateLockedAt: Date,
  rateLockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rateLockReason: String,
}, {
  timestamps: true,
});

module.exports = mongoose.model('PurchaseLine', purchaseLineSchema);