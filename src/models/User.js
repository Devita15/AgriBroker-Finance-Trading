const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Required fields
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: {
      values: ['superadmin', 'operator'],
      message: '{VALUE} is not a valid role',
    },
    required: [true, 'Role is required'],
  },
  
  // Optional profile fields
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  businessName: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  state: {
    type: String,
    trim: true,
    default: '',
  },
  gstNumber: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
  },
  panNumber: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
  },
  bankAccountNumber: {
    type: String,
    trim: true,
    default: '',
  },
  ifscCode: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
  },
  bankName: {
    type: String,
    trim: true,
    default: '',
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  lastLoginIp: {
    type: String,
    default: null,
  },
  refreshToken: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.passwordHash;
      delete ret.refreshToken;
      delete ret.__v;
      // Mask bank account number for security
      if (ret.bankAccountNumber && ret.bankAccountNumber.length > 4) {
        ret.bankAccountNumber = 'XXXX-XXXX-' + ret.bankAccountNumber.slice(-4);
      }
      return ret;
    },
  },
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  // Check if already hashed (bcrypt hashes start with $2)
  if (!this.passwordHash.startsWith('$2')) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  if (!password || !this.passwordHash) return false;
  try {
    return await bcrypt.compare(password, this.passwordHash);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

// Check if user is active
userSchema.methods.isAccountActive = function() {
  return this.isActive;
};

const User = mongoose.model('User', userSchema);

module.exports = User;