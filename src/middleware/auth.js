// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Authorization header is required' });
    }
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Invalid format. Use: Bearer <token>' });
    }

    const token = authHeader.slice(7);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token is required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired. Please refresh.' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account is deactivated. Contact administrator.' });
    }

    req.user   = user;
    req.userId = user._id;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`, { stack: error.stack, ip: req.ip });
    return res.status(500).json({ success: false, error: 'Authentication failed due to server error' });
  }
};

module.exports = authenticate;
