const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs (super-admin only)
// @route   GET /api/audit-logs
// @access  Super Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, resourceType, userId, limit = 50, skip = 0 } = req.query;
    const user = req.user;

    // Only super-admin can view audit logs
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view audit logs' 
      });
    }

    // Build filter
    const filter = {};
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (userId) filter.userId = userId;

    // Get total count for pagination
    const total = await AuditLog.countDocuments(filter);

    // Get paginated logs
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({ 
      success: true, 
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get audit logs for specific super-admin
// @route   GET /api/audit-logs/user/:userId
// @access  Super Admin
exports.getAuditLogsByUser = async (req, res) => {
  try {
    const user = req.user;
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Only super-admin can view audit logs
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view audit logs' 
      });
    }

    const total = await AuditLog.countDocuments({ userId });
    const logs = await AuditLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.status(200).json({ 
      success: true, 
      data: logs,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get audit log details
// @route   GET /api/audit-logs/:id
// @access  Super Admin
exports.getAuditLogDetail = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only super-admin can view audit logs
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view audit logs' 
      });
    }

    const log = await AuditLog.findById(id).populate('userId', 'name email');

    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get audit logs summary (stats)
// @route   GET /api/audit-logs/summary/stats
// @access  Super Admin
exports.getAuditLogsSummary = async (req, res) => {
  try {
    const user = req.user;

    // Only super-admin can view audit logs
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view audit logs' 
      });
    }

    const [
      totalLogs,
      actionCounts,
      resourceCounts,
      successRate
    ] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.aggregate([
        { $group: { _id: '$action', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $group: { _id: '$resourceType', count: { $sum: 1 } } }
      ]),
      AuditLog.aggregate([
        { $group: { 
          _id: null, 
          total: { $sum: 1 },
          success: { $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] } }
        }}
      ])
    ]);

    const successPercentage = successRate[0] ? 
      (successRate[0].success / successRate[0].total * 100).toFixed(2) : 0;

    res.status(200).json({ 
      success: true, 
      data: {
        totalLogs,
        actionCounts: Object.fromEntries(actionCounts.map(a => [a._id, a.count])),
        resourceCounts: Object.fromEntries(resourceCounts.map(r => [r._id, r.count])),
        successRate: `${successPercentage}%`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
