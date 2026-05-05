// src/models/Farmer.js
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema(
  {
    name:             { type: String, required: [true, 'Farmer name is required'], trim: true },
    mobile:           { type: String, required: [true, 'Mobile number is required'], trim: true },
    address:          { type: String, trim: true, default: '' },
    village:          { type: String, trim: true, default: '' },
    city:             { type: String, trim: true, default: '' },
    state:            { type: String, trim: true, default: '' },
    // Bank details (optional — used for bank transfer payments)
    bankAccountNumber:{ type: String, trim: true, default: '' },
    ifscCode:         { type: String, trim: true, uppercase: true, default: '' },
    bankName:         { type: String, trim: true, default: '' },
    // GST (optional — only if GST registered)
    gstNumber:        { type: String, trim: true, uppercase: true, default: '' },
    isActive:         { type: Boolean, default: true },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Auto-tracked summaries (denormalised for fast dashboard reads)
    totalPurchases:   { type: Number, default: 0 },
    totalPurchaseValue:{ type: Number, default: 0 },
    totalPaid:        { type: Number, default: 0 },
    pendingDues:      { type: Number, default: 0 },
    advanceBalance:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

farmerSchema.index({ name: 'text', mobile: 1 });
farmerSchema.index({ isActive: 1 });
farmerSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Farmer', farmerSchema);
