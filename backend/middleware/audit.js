const AuditLog = require('../models/AuditLog');

/**
 * Middleware to log super-admin actions to AuditLog
 * Attach to req object: req.auditLog data before passing to controller
 */
const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    // Only log for super-admin users
    if (req.user?.role !== 'super-admin') {
      return next();
    }

    // Store audit info on request for controller to use
    req.auditLog = {
      action,
      resourceType,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    };

    next();
  };
};

/**
 * Log audit event to database
 * Called from controllers after operation completes
 */
const logAudit = async (auditData) => {
  try {
    await AuditLog.create(auditData);
  } catch (err) {
    console.error('Failed to log audit:', err);
    // Don't throw - audit logging failure shouldn't break the operation
  }
};

/**
 * Helper to format before/after changes
 */
const getChanges = (before, after) => {
  const changes = {};
  
  for (const key in after) {
    if (before[key] !== after[key]) {
      changes[key] = {
        before: before[key],
        after: after[key]
      };
    }
  }

  return Object.keys(changes).length > 0 ? changes : null;
};

module.exports = {
  auditMiddleware,
  logAudit,
  getChanges
};
