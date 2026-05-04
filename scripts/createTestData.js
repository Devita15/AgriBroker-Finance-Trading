// scripts/createTestData.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../src/models/User');
const Vendor = require('../src/models/Vendor');
const Farmer = require('../src/models/Farmer');

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farm_erp');
    console.log('✅ Connected to MongoDB');

    // Create Vendor User
    const vendorUser = await User.create({
      name: 'Test Vendor',
      email: 'vendor@farmerp.com',
      passwordHash: await bcrypt.hash('Vendor@123', 10),
      role: 'vendor',
      phone: '+919876543211',
      isActive: true,
    });
    console.log('✅ Vendor user created:', vendorUser.email);

    // Create Vendor Profile
    const vendor = await Vendor.create({
      userId: vendorUser._id,
      businessName: 'Test Trading Company',
      address: '123 Market Street',
      city: 'Pune',
      state: 'Maharashtra',
      gstNumber: '27AAAAA0000A1Z',
      isActive: true,
    });
    console.log('✅ Vendor profile created:', vendor.businessName);

    // Create Operator User
    const operatorUser = await User.create({
      name: 'Test Operator',
      email: 'operator@farmerp.com',
      passwordHash: await bcrypt.hash('Operator@123', 10),
      role: 'operator',
      phone: '+919876543212',
      isActive: true,
    });
    console.log('✅ Operator user created:', operatorUser.email);

    // Create Farmers
    const farmers = [
      {
        vendorId: vendor._id,
        name: 'Ram Yadav',
        mobile: '+919876543001',
        address: 'Village Shirur',
        village: 'Shirur',
        city: 'Pune',
        bankAccountNumber: '123456789001',
        ifscCode: 'SBIN0012345',
        bankName: 'SBI',
      },
      {
        vendorId: vendor._id,
        name: 'Sham Patil',
        mobile: '+919876543002',
        address: 'Village Khed',
        village: 'Khed',
        city: 'Pune',
        bankAccountNumber: '123456789002',
        ifscCode: 'SBIN0012345',
        bankName: 'SBI',
      },
      {
        vendorId: vendor._id,
        name: 'Kisan More',
        mobile: '+919876543003',
        address: 'Village Chakan',
        village: 'Chakan',
        city: 'Pune',
      },
    ];

    for (const farmerData of farmers) {
      const farmer = await Farmer.create(farmerData);
      console.log(`✅ Farmer created: ${farmer.name} (${farmer.mobile})`);
    }

    console.log('\n=================================');
    console.log('🎉 Test Data Created Successfully!');
    console.log('=================================');
    console.log('\n📧 Login Credentials:');
    console.log('SuperAdmin: superadmin@farmerp.com / Admin@123456');
    console.log('Vendor: vendor@farmerp.com / Vendor@123');
    console.log('Operator: operator@farmerp.com / Operator@123');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    process.exit(1);
  }
}

createTestData();