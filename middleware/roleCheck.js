const User = require('../models/User');

exports.checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${roles.join(' or ')} role required`
      });
    }

    next();
  };
};

exports.checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resource = await model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Check if user owns this resource
      const userId = req.user._id;
      const isOwner = resource.user?.toString() === userId.toString() ||
                     resource.student?.toString() === userId.toString() ||
                     resource.createdBy?.toString() === userId.toString();

      if (!isOwner && req.user.role !== 'admin' && req.user.role !== 'principal') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership Check Error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking ownership'
      });
    }
  };
};