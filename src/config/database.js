// src/config/database.js
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm_erp';
    // Remove useNewUrlParser and useUnifiedTopology as they are deprecated
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.log(`❌ MongoDB connection error: ${error.message}`);
    console.log('   Server will continue running but database features will not work');
    logger.error(`Database connection error: ${error.message}`);
    return null;
  }
};

module.exports = connectDB;