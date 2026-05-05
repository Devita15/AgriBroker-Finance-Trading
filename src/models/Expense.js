// src/models/Expense.js
const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'transport_logistics',
  'labour_wages',
  'market_fees',
  'storage_cold_chain',
  'shop_office',
  'repairs_maintenance',
  'banking_finance',
  'marketing_misc',
];

const expenseSchema = new mongoose.Schema(
  {
    category:       {
      type: String,
      required: true,
      enum: EXPENSE_CATEGORIES,
    },
    amount:         { type: Number, required: true, min: [0.01, 'Amount must be > 0'] },
    description:    { type: String, required: true, trim: true },
    expenseDate:    { type: Date, default: Date.now },
    paidBy:         {
      type: String,
      required: true,
      enum: ['cash', 'upi', 'bank', 'cheque'],
    },
    paidTo:         { type: String, trim: true, default: '' },
    referenceNumber:{ type: String, trim: true, default: '' },

    // Approval workflow
    approvalStatus: {
      type: String,
      enum: ['auto_approved', 'pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt:     { type: Date, default: null },
    rejectionReason:{ type: String, default: '' },
    cancelReason:   { type: String, default: '' },

    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:          { type: String, default: '' },
  },
  { timestamps: true }
);

expenseSchema.index({ category: 1 });
expenseSchema.index({ approvalStatus: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
