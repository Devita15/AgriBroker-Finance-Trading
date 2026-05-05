// src/models/Sale.js
const mongoose = require('mongoose');

const saleLineSchema = new mongoose.Schema(
  {
    productName:  { type: String, required: true, trim: true },
    warehouse:    { type: String, default: 'Main Warehouse' },
    qty:          { type: Number, required: true },
    unit:         { type: String, default: 'kg' },
    sellingPrice: { type: Number, required: true },
    lineTotal:    { type: Number, required: true },
  },
  { _id: true }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber:    { type: String, unique: true },
    buyerName:        { type: String, required: true, trim: true },
    buyerMobile:      { type: String, trim: true, default: '' },
    buyerGst:         { type: String, trim: true, default: '' },
    saleDate:         { type: Date, default: Date.now },
    lines:            { type: [saleLineSchema], default: [] },
    subTotal:         { type: Number, default: 0 },
    gstPercent:       { type: Number, default: 0 },
    gstAmount:        { type: Number, default: 0 },
    grandTotal:       { type: Number, default: 0 },
    paymentMode:      { type: String, enum: ['cash', 'upi', 'bank', 'cheque', 'credit'], default: 'cash' },
    referenceNumber:  { type: String, default: '' },
    notes:            { type: String, default: '' },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

saleSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    const year  = new Date().getFullYear().toString().slice(-2);
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

saleSchema.index({ saleDate: -1 });
saleSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Sale', saleSchema);
