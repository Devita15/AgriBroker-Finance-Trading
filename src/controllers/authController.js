// src/controllers/authController.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const generateAccessToken  = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN         || '15m' });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'  });

const formatUser = (user) => ({
  id:                user._id,
  name:              user.name,
  email:             user.email,
  role:              user.role,
  phone:             user.phone             || '',
  businessName:      user.businessName      || '',
  address:           user.address           || '',
  city:              user.city              || '',
  state:             user.state             || '',
  gstNumber:         user.gstNumber         || '',
  panNumber:         user.panNumber         || '',
  bankAccountNumber: user.bankAccountNumber || '',
  ifscCode:          user.ifscCode          || '',
  bankName:          user.bankName          || '',
  isActive:          user.isActive,
  createdAt:         user.createdAt,
  updatedAt:         user.updatedAt,
  lastLoginAt:       user.lastLoginAt,
});

exports.register = async (req, res) => {
  try {
    const {
      name, email, password, role, phone,
      businessName, address, city, state,
      gstNumber, panNumber, bankAccountNumber, ifscCode, bankName,
    } = req.body;

    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ success: false, error: 'A user with this email already exists' });
    }

    const user = await User.create({
      name, email,
      passwordHash: password,
      role:         role || 'operator',
      phone:        phone             || '',
      businessName: businessName      || '',
      address:      address           || '',
      city:         city              || '',
      state:        state             || '',
      gstNumber:    gstNumber         || '',
      panNumber:    panNumber         || '',
      bankAccountNumber: bankAccountNumber || '',
      ifscCode:     ifscCode          || '',
      bankName:     bankName          || '',
    });

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken  = refreshToken;
    await user.save();

    logger.info(`New user registered: ${user.email} (${user.role})`);
    res.status(201).json({ success: true, message: 'User registered successfully', user: formatUser(user), accessToken, refreshToken });
  } catch (error) {
    logger.error(`Register error: ${error.message}`, { stack: error.stack });
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Duplicate field. Use different details.' });
    }
    res.status(500).json({ success: false, error: 'Registration failed. Please try again.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account deactivated. Contact administrator.' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken  = refreshToken;
    await user.save();

    logger.info(`Login: ${user.email} from ${req.ip}`);
    res.json({ success: true, message: 'Login successful', user: formatUser(user), accessToken, refreshToken });
  } catch (error) {
    logger.error(`Login error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Login failed. Please try again.' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user)                           return res.status(401).json({ success: false, error: 'User not found' });
    if (user.refreshToken !== refreshToken) return res.status(401).json({ success: false, error: 'Refresh token revoked' });

    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken     = newRefreshToken;
    await user.save();

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Token refresh failed.' });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) { user.refreshToken = null; await user.save(); }
    logger.info(`Logout: ${req.user.email}`);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Logout error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Logout failed.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: formatUser(user) });
  } catch (error) {
    logger.error(`GetMe error: ${error.message}`, { stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'businessName', 'address', 'city', 'state', 'gstNumber', 'panNumber', 'bankAccountNumber', 'ifscCode', 'bankName'];
    const update  = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

    const updated = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true, runValidators: true })
      .select('-passwordHash -refreshToken');

    if (!updated) return res.status(404).json({ success: false, error: 'User not found' });

    logger.info(`Profile updated: ${updated.email}`);
    res.json({ success: true, message: 'Profile updated successfully', user: formatUser(updated) });
  } catch (error) {
    logger.error(`Profile update error: ${error.message}`, { stack: error.stack });
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) });
    }
    res.status(500).json({ success: false, error: 'Profile update failed.' });
  }
};
