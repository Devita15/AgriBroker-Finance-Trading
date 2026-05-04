const roleCheck = (...allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required' 
        });
      }
  
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false,
          error: 'Access denied. You do not have permission to perform this action.',
          requiredRoles: allowedRoles,
          userRole: req.user.role
        });
      }
  
      next();
    };
  };
  
  module.exports = { roleCheck };