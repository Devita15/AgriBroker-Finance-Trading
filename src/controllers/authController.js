const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

class AuthController {
  constructor() {
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
  }

  generateAccessToken(userId) {
    return jwt.sign(
      { userId }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId }, 
      process.env.JWT_REFRESH_SECRET, 
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  async register(req, res) {
    try {
      const { 
        name, email, password, role, phone,
        businessName, address, city, state,
        gstNumber, panNumber, bankAccountNumber,
        ifscCode, bankName 
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ 
          success: false,
          error: 'A user with this email already exists' 
        });
      }

      // Create user with all fields
      const user = await User.create({
        name,
        email,
        passwordHash: password,
        role: role || 'operator',
        phone: phone || '',
        businessName: businessName || '',
        address: address || '',
        city: city || '',
        state: state || '',
        gstNumber: gstNumber || '',
        panNumber: panNumber || '',
        bankAccountNumber: bankAccountNumber || '',
        ifscCode: ifscCode || '',
        bankName: bankName || '',
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(user._id);
      const refreshToken = this.generateRefreshToken(user._id);

      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      logger.info(`New user registered: ${user.email} (${user.role})`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: this.formatUserResponse(user),
        accessToken,
        refreshToken,
      });

    } catch (error) {
      logger.error(`Registration error: ${error.message}`, { stack: error.stack });
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false,
          error: 'Duplicate field value. Please use different details.' 
        });
      }

      res.status(500).json({ 
        success: false,
        error: 'Registration failed. Please try again later.' 
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid email or password' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          success: false,
          error: 'Account is deactivated. Please contact administrator.' 
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid email or password' 
        });
      }

      // Update last login
      user.lastLoginAt = new Date();
      user.lastLoginIp = req.ip;

      // Generate tokens
      const accessToken = this.generateAccessToken(user._id);
      const refreshToken = this.generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      logger.info(`User logged in: ${user.email} from IP: ${req.ip}`);

      res.json({
        success: true,
        message: 'Login successful',
        user: this.formatUserResponse(user),
        accessToken,
        refreshToken,
      });

    } catch (error) {
      logger.error(`Login error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Login failed. Please try again later.' 
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ 
          success: false,
          error: 'Refresh token is required' 
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      } catch (error) {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid or expired refresh token' 
        });
      }

      // Find user and verify stored token
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      if (user.refreshToken !== refreshToken) {
        return res.status(401).json({ 
          success: false,
          error: 'Refresh token has been revoked' 
        });
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      // Update stored refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

    } catch (error) {
      logger.error(`Refresh token error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Token refresh failed. Please try again later.' 
      });
    }
  }

  async logout(req, res) {
    try {
      const user = await User.findById(req.userId);
      
      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      logger.info(`User logged out: ${req.user.email}`);

      res.json({ 
        success: true, 
        message: 'Logged out successfully' 
      });

    } catch (error) {
      logger.error(`Logout error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Logout failed. Please try again later.' 
      });
    }
  }

  async getMe(req, res) {
    try {
      const user = await User.findById(req.userId).select('-passwordHash -refreshToken');

      if (!user) {
        return res.status(404).json({ 
          success: false,
          error: 'User not found' 
        });
      }

      res.json({
        success: true,
        user: this.formatUserResponse(user),
      });

    } catch (error) {
      logger.error(`Get profile error: ${error.message}`, { stack: error.stack });
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve profile. Please try again later.' 
      });
    }
  }

  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const allowedFields = [
        'name', 'phone', 'businessName', 'address', 
        'city', 'state', 'gstNumber', 'panNumber',
        'bankAccountNumber', 'ifscCode', 'bankName'
      ];

      // Filter only allowed fields from request body
      const updateData = {};
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      // Don't allow role update through this endpoint
      if (updateData.role) {
        delete updateData.role;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-passwordHash -refreshToken');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      logger.info(`User profile updated: ${updatedUser.email}`);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: this.formatUserResponse(updatedUser),
      });

    } catch (error) {
      logger.error(`Profile update error: ${error.message}`, { stack: error.stack });
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: Object.values(error.errors).map(e => e.message)
        });
      }

      res.status(500).json({
        success: false,
        error: 'Profile update failed. Please try again later.'
      });
    }
  }

  // Helper method to format user response
  formatUserResponse(user) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      businessName: user.businessName || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      gstNumber: user.gstNumber || '',
      panNumber: user.panNumber || '',
      bankAccountNumber: user.bankAccountNumber || '',
      ifscCode: user.ifscCode || '',
      bankName: user.bankName || '',
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}

module.exports = new AuthController();