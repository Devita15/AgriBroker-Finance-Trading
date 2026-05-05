// scripts/testLogin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farm_erp');
    console.log('✅ Connected to MongoDB');

    // Find superadmin
    const user = await User.findOne({ email: 'superadmin@farmerp.com' });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('\n User Details:');
    console.log(`Email: ${user.email}`);
    console.log(`Stored Hash: ${user.passwordHash}`);
    
    // Test with password
    const testPassword = 'Admin123';
    const isValid = await bcrypt.compare(testPassword, user.passwordHash);
    
    console.log(`\n🔐 Password Test:`);
    console.log(`Password used: ${testPassword}`);
    console.log(`Is valid: ${isValid ? '✅ YES' : '❌ NO'}`);
    
    if (isValid) {
      console.log('\n✅ Login would work with this password!');
    } else {
      console.log('\n❌ Password does not match. Please check the password.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testLogin();