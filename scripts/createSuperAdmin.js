// scripts/createAdminToUsers.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import the actual User model
const User = require('../src/models/User');

async function createAdminToUsers() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/farm_erp';
    console.log('Connecting to:', mongoURI);
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to DB');

    // Delete existing admin from users collection
    await User.deleteMany({ email: 'superadmin@farmerp.com' });
    console.log('✅ Deleted existing from users collection');

    // Create password hash directly (prevent double hashing)
    const plainPassword = 'Admin123';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(plainPassword, salt);
    
    console.log('Password:', plainPassword);
    console.log('Hash:', hash);

    // Create admin using the actual User model
    const admin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@farmerp.com',
      passwordHash: hash,  // Use pre-hashed password
      role: 'superadmin',
      phone: '+919876543210',
      isActive: true,
    });

    // Verify the password works
    const isValid = await bcrypt.compare(plainPassword, admin.passwordHash);
    
    console.log('\n=================================');
    console.log('✅ Admin Created in Users Collection!');
    console.log(`📧 Email: superadmin@farmerp.com`);
    console.log(`🔑 Password: ${plainPassword}`);
    console.log(`👤 Name: Super Admin`);
    console.log(`🆔 ID: ${admin._id}`);
    console.log(`🔐 Verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log('=================================');
    
    // Test login directly
    console.log('\n🔍 Testing login with comparePassword method:');
    const testLogin = await admin.comparePassword(plainPassword);
    console.log(`ComparePassword result: ${testLogin ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

createAdminToUsers();