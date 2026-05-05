// src/models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    productName:    { type: String, required: true, trim: true },
    warehouse:      { type: String, default: 'Main Warehouse', trim: true },
    currentStock:   { type: Number, default: 0 },
    unit:           { type: String, default: 'kg' },
    lastUpdated:    { type: Date, default: Date.now },
  },
  { timestamps: true }
);

inventorySchema.index({ productName: 1, warehouse: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);
