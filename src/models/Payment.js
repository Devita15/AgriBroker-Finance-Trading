// src/models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    purchase:         { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', required: true },
    farmer:           { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer',   required: true },
    amount:           { type: Number, required: true, min: [0.01, 'Amount must be > 0'] },
    paymentMode:      {
      type: String,
      required: true,
      enum: ['cash', 'upi', 'bank', 'cheque'],
    },
    referenceNumber:  { type: String, trim: true, default: '' },
    paymentDate:      { type: Date, default: Date.now },
    // Cheque-specific
    chequeStatus:     {
      type: String,
      enum: ['pending_clearance', 'cleared', 'bounced', null],
      default: null,
    },
    chequeNumber:     { type: String, default: '' },
    chequeDate:       { type: Date, default: null },
    bankName:         { type: String, default: '' },
    notes:            { type: String, default: '' },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ purchase: 1 });
paymentSchema.index({ farmer: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
