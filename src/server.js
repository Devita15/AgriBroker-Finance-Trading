// src/server.js
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;

// Connect to database (optional - server will run even if DB fails)
connectDB().catch(err => {
  console.log('⚠️ Database connection failed, but server will continue running');
  console.log('   Make sure MongoDB is running for full functionality');
});

const server = app.listen(PORT, () => {
  console.log('\n=================================');
  console.log('Farm ERP Server Started');
  console.log('=================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API test: http://localhost:${PORT}/api/test`);
  console.log(`API Docs: http://localhost:${PORT}/api-docs`);
  console.log('=================================\n');
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

module.exports = server;