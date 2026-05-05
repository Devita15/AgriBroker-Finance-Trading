// src/models/Ledger.js
const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema(
  {
    farmer:           { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    entryDate:        { type: Date, default: Date.now },
    entryType:        {
      type: String,
      required: true,
      enum: [
        'purchase',          // credit — system owes farmer
        'payment',           // debit  — paid to farmer
        'advance_given',     // debit  — advance posted
        'advance_adjusted',  // credit — advance deducted from purchase
        'return_deduction',  // credit reversal
        'adjustment',        // manual correction with reason
      ],
    },
    description:      { type: String, required: true },
    debit:            { type: Number, default: 0 },   // money OUT (paid to farmer)
    credit:           { type: Number, default: 0 },   // money OWED to farmer
    runningBalance:   { type: Number, required: true }, // positive = system owes farmer
    refId:            { type: mongoose.Schema.Types.ObjectId, default: null }, // purchase / payment id
    refModel:         { type: String, enum: ['Purchase', 'Payment', 'Advance', null], default: null },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ledgerSchema.index({ farmer: 1, entryDate: -1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
