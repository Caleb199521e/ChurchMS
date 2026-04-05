const mongoose = require('mongoose');

/**
 * Branch Access Middleware
 * Enforces branch-level data isolation
 * 
 * Rules:
 * - Super Admin: Can access any branch (must pass branchId or query param)
 * - Branch Manager: Can only access their assigned branch
 * - Staff: Can only access their assigned branch
 * - Member: Can only access their assigned branch
 */

const branchAccess = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Super Admin can access all branches, but must specify which one
    if (user.role === 'super-admin') {
      // Super admin can pass branchId in query or body
      const requestedBranch = req.query.branchId || req.body.branchId || req.params.branchId;
      
      if (requestedBranch) {
        // Validate it's a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(requestedBranch)) {
          return res.status(400).json({ success: false, message: 'Invalid branch ID' });
        }
        req.branchId = requestedBranch;
      }
      // If no branchId specified and it's a create/update operation that requires branch
      // It will be caught in the individual controller
      
      return next();
    }

    // Branch Manager and Staff must have a branchId assigned
    if (!user.branchId) {
      return res.status(403).json({ 
        success: false, 
        message: 'User must be assigned to a branch' 
      });
    }

    // Check if they're trying to access a different branch
    const requestedBranch = req.query.branchId || req.body.branchId || req.params.branchId;
    
    if (requestedBranch && requestedBranch !== user.branchId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only access your assigned branch' 
      });
    }

    // Attach user's branch to request
    req.branchId = user.branchId.toString();
    
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = branchAccess;
