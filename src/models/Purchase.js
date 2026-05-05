// src/models/Purchase.js
const mongoose = require('mongoose');

const purchaseLineSchema = new mongoose.Schema(
  {
    productName:      { type: String, required: true, trim: true },
    pricingType:      {
      type: String,
      required: true,
      enum: ['kg', 'quintal', 'piece', 'bunch', 'crate', 'dozen', 'flat'],
    },
    // Raw input quantities
    bags:             { type: Number, default: 0 },         // for KG type
    weightPerBag:     { type: Number, default: 0 },         // kg per bag
    actualQty:        { type: Number, required: true },     // total gross qty
    qualityDeduction: { type: Number, default: 0 },         // qty deducted for quality
    billedQty:        { type: Number, required: true },     // actualQty - qualityDeduction
    unit:             { type: String, default: '' },        // kg / quintal / piece etc.
    rate:             { type: Number, required: true },     // rate per unit
    lineTotal:        { type: Number, required: true },     // billedQty * rate
    rateLockTime:     { type: Date, default: Date.now },
    notes:            { type: String, default: '' },
  },
  { _id: true }
);

const deductionsSchema = new mongoose.Schema(
  {
    transport:        { type: Number, default: 0 },
    labour:           { type: Number, default: 0 },
    commission:       { type: Number, default: 0 },
    commissionType:   { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
    storage:          { type: Number, default: 0 },
    storageNote:      { type: String, default: '' },
    returnDeduction:  { type: Number, default: 0 },
    returnNote:       { type: String, default: '' },
    advanceAdjusted:  { type: Number, default: 0 },
    other:            { type: Number, default: 0 },
    otherNote:        { type: String, default: '' },
  },
  { _id: false }
);

const purchaseSchema = new mongoose.Schema(
  {
    receiptNumber:    { type: String, unique: true },
    farmer:           { type: mongoose.Schema.Types.ObjectId, ref: 'Farmer', required: true },
    purchaseDate:     { type: Date, default: Date.now },
    lines:            { type: [purchaseLineSchema], default: [] },
    deductions:       { type: deductionsSchema, default: () => ({}) },
    grossTotal:       { type: Number, default: 0 },   // sum of all line totals
    totalDeductions:  { type: Number, default: 0 },
    finalPayable:     { type: Number, default: 0 },   // grossTotal - totalDeductions
    amountPaid:       { type: Number, default: 0 },
    amountDue:        { type: Number, default: 0 },
    status:           {
      type: String,
      enum: ['draft', 'saved', 'partial', 'paid'],
      default: 'draft',
    },
    createdBy:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes:            { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate receipt number before save
purchaseSchema.pre('save', async function (next) {
  if (this.isNew && !this.receiptNumber) {
    const count = await this.constructor.countDocuments();
    const year  = new Date().getFullYear().toString().slice(-2);
    this.receiptNumber = `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

purchaseSchema.index({ farmer: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
