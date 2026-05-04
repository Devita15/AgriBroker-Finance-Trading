// src/models/Purchase.js
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true,
  },
  farmerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  grossTotal: {
    type: Number,
    default: 0,
  },
  deductionTransport: {
    type: Number,
    default: 0,
  },
  deductionLabour: {
    type: Number,
    default: 0,
  },
  deductionCommission: {
    type: Number,
    default: 0,
  },
  deductionStorage: {
    type: Number,
    default: 0,
  },
  deductionMisc: {
    type: Number,
    default: 0,
  },
  advanceAdjusted: {
    type: Number,
    default: 0,
  },
  returnValue: {
    type: Number,
    default: 0,
  },
  finalPayable: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  amountDue: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'saved', 'partially_paid', 'fully_paid'],
    default: 'draft',
  },
  pdfUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Auto-update amountDue before save
purchaseSchema.pre('save', function(next) {
  this.amountDue = this.finalPayable - this.amountPaid;
  if (this.amountDue === 0 && this.finalPayable > 0) {
    this.status = 'fully_paid';
  } else if (this.amountPaid > 0 && this.amountDue > 0) {
    this.status = 'partially_paid';
  }
  next();
});

module.exports = mongoose.model('Purchase', purchaseSchema);