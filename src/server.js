const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/database');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Connect to database
connectDB().catch(err => {
  console.log('⚠️ Database connection failed, but server will continue running');
  console.log('   Make sure MongoDB is running for full functionality');
});

const server = app.listen(PORT, HOST, () => {
  console.log('\n=================================');
  console.log('Farm ERP Server Started');
  console.log('=================================');
  console.log(`Server running on port ${PORT}`);
  
  // Get all network interfaces
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  const urls = [];
  
  // Add localhost
  urls.push(`http://localhost:${PORT}`);
  
  // Add network IPs
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${PORT}`);
      }
    }
  }
  
  console.log('\nAccess URLs:');
  urls.forEach(url => {
    console.log(`  ${url}/api-docs`);
  });
  
  console.log('\nHealth check:');
  console.log(`  http://localhost:${PORT}/health`);
  
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