// src/controllers/inventoryController.js
const Inventory = require('../models/Inventory');
const logger    = require('../config/logger');

exports.getAllInventory = async (req, res) => {
  try {
    const { warehouse, search, lowStock } = req.query;
    const filter = {};
    if (warehouse) filter.warehouse = warehouse;
    if (search)    filter.productName = { $regex: search, $options: 'i' };
    if (lowStock === 'true') filter.currentStock = { $lte: 10 };

    const inventory = await Inventory.find(filter).sort({ productName: 1 });
    res.json({ success: true, data: inventory });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
};

exports.getProductStock = async (req, res) => {
  try {
    const { productName } = req.params;
    const entries = await Inventory.find({ productName: { $regex: productName, $options: 'i' } });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch product stock' });
  }
};

exports.adjustStock = async (req, res) => {
  try {
    const { productName, warehouse = 'Main Warehouse', adjustment, reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, error: 'Reason is required for stock adjustment' });

    const inv = await Inventory.findOne({ productName, warehouse });
    if (!inv) return res.status(404).json({ success: false, error: 'Product not found in inventory' });

    const newStock = inv.currentStock + Number(adjustment);
    if (newStock < 0) return res.status(400).json({ success: false, error: 'Adjustment would result in negative stock' });

    inv.currentStock = newStock;
    inv.lastUpdated  = new Date();
    await inv.save();

    logger.info(`Stock adjusted: ${productName} at ${warehouse} — adjustment: ${adjustment} — reason: ${reason} by ${req.user.email}`);
    res.json({ success: true, message: 'Stock adjusted successfully', data: inv });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to adjust stock' });
  }
};

exports.transferStock = async (req, res) => {
  try {
    const { productName, fromWarehouse, toWarehouse, qty } = req.body;
    if (!productName || !fromWarehouse || !toWarehouse || !qty) {
      return res.status(400).json({ success: false, error: 'productName, fromWarehouse, toWarehouse, and qty are required' });
    }
    if (fromWarehouse === toWarehouse) {
      return res.status(400).json({ success: false, error: 'Source and destination warehouses must differ' });
    }

    const source = await Inventory.findOne({ productName, warehouse: fromWarehouse });
    if (!source || source.currentStock < qty) {
      return res.status(400).json({ success: false, error: `Insufficient stock in ${fromWarehouse}` });
    }

    source.currentStock -= Number(qty);
    source.lastUpdated   = new Date();
    await source.save();

    await Inventory.findOneAndUpdate(
      { productName, warehouse: toWarehouse },
      { $inc: { currentStock: Number(qty) }, $set: { unit: source.unit, lastUpdated: new Date() } },
      { upsert: true, new: true }
    );

    logger.info(`Stock transfer: ${qty} ${source.unit} of ${productName} from ${fromWarehouse} → ${toWarehouse} by ${req.user.email}`);
    res.json({ success: true, message: 'Stock transferred successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to transfer stock' });
  }
};
