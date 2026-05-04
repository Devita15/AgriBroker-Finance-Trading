const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../config/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        error: 'Authorization header is required' 
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Token is required' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token has expired. Please refresh your token' 
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          error: 'Invalid token' 
        });
      }
      throw error;
    }

    // Find user
    const user = await User.findById(decoded.userId).select('-passwordHash -refreshToken');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'Account is deactivated. Please contact administrator.' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`, { 
      stack: error.stack,
      ip: req.ip 
    });
    
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed due to server error' 
    });
  }
};

module.exports = authenticate;