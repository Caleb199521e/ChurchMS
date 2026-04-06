const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Visitor = require('../models/Visitor');
const Branch = require('../models/Branch');
const mongoose = require('mongoose');

// @desc    Get attendance trends for a branch
// @route   GET /api/analytics/attendance-trend
// @access  Super Admin
exports.getAttendanceTrend = async (req, res) => {
  try {
    const { branchId, months = 6 } = req.query;
    const user = req.user;

    // Only super-admin can view analytics
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view analytics' 
      });
    }

    if (!branchId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch ID is required' 
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Calculate date range for the past N months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Get attendance records for this branch
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          branchId: new mongoose.Types.ObjectId(branchId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            serviceType: '$serviceType'
          },
          count: { $sum: { $size: '$members' } },
          avgAttendance: { $avg: { $size: '$members' } }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        branch: { _id: branch._id, name: branch.name },
        attendanceData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get growth metrics for branches
// @route   GET /api/analytics/growth
// @access  Super Admin
exports.getBranchGrowth = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const user = req.user;

    // Only super-admin can view analytics
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view analytics' 
      });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Get all branches
    const branches = await Branch.find({ isActive: true });

    // For each branch, calculate member growth
    const growthData = await Promise.all(branches.map(async (branch) => {
      const memberGrowth = await Member.aggregate([
        {
          $match: {
            branchId: new mongoose.Types.ObjectId(branch._id),
            joinDate: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$joinDate' },
              month: { $month: '$joinDate' }
            },
            newMembers: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      const totalMembers = await Member.countDocuments({ 
        branchId: branch._id, 
        isActive: true 
      });

      const totalVisitors = await Visitor.countDocuments({ 
        branchId: branch._id 
      });

      return {
        branch: { _id: branch._id, name: branch.name },
        totalMembers,
        totalVisitors,
        memberGrowth
      };
    }));

    res.status(200).json({ 
      success: true, 
      data: { growthData }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Compare growth between branches
// @route   GET /api/analytics/compare
// @access  Super Admin
exports.compareBranches = async (req, res) => {
  try {
    const { branchIds, metric = 'members', months = 6 } = req.query;
    const user = req.user;

    // Only super-admin can view analytics
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view analytics' 
      });
    }

    if (!branchIds) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch IDs are required' 
      });
    }

    const branchIdArray = Array.isArray(branchIds) ? branchIds : branchIds.split(',');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    const endDate = new Date();

    const comparisonData = await Promise.all(branchIdArray.map(async (branchId) => {
      const branch = await Branch.findById(branchId);
      if (!branch) return null;

      let data = {};

      if (metric === 'members' || metric === 'all') {
        const memberData = await Member.aggregate([
          {
            $match: {
              branchId: new mongoose.Types.ObjectId(branchId),
              joinDate: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$joinDate' },
                month: { $month: '$joinDate' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 }
          }
        ]);

        data.memberTrend = memberData;
        data.totalMembers = await Member.countDocuments({ 
          branchId, 
          isActive: true 
        });
      }

      if (metric === 'attendance' || metric === 'all') {
        const attendanceData = await Attendance.aggregate([
          {
            $match: {
              branchId: new mongoose.Types.ObjectId(branchId),
              date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' }
              },
              avgAttendance: { $avg: { $size: '$members' } },
              totalAttendance: { $sum: { $size: '$members' } }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 }
          }
        ]);

        data.attendanceTrend = attendanceData;
      }

      if (metric === 'visitors' || metric === 'all') {
        const visitorData = await Visitor.aggregate([
          {
            $match: {
              branchId: new mongoose.Types.ObjectId(branchId),
              firstVisitDate: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$firstVisitDate' },
                month: { $month: '$firstVisitDate' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 }
          }
        ]);

        data.visitorTrend = visitorData;
        data.totalVisitors = await Visitor.countDocuments({ branchId });
      }

      return {
        branch: { _id: branch._id, name: branch.name },
        data
      };
    }));

    // Filter out null values
    const validComparisons = comparisonData.filter(d => d !== null);

    res.status(200).json({ 
      success: true, 
      data: { comparisons: validComparisons }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get overall statistics
// @route   GET /api/analytics/stats
// @access  Super Admin
exports.getAnalyticsStats = async (req, res) => {
  try {
    const user = req.user;

    // Only super-admin can view analytics
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view analytics' 
      });
    }

    const branches = await Branch.find({ isActive: true }).select('_id name');

    const stats = await Promise.all(branches.map(async (branch) => {
      const [totalMembers, totalVisitors, totalAttendanceRecords] = await Promise.all([
        Member.countDocuments({ branchId: branch._id, isActive: true }),
        Visitor.countDocuments({ branchId: branch._id }),
        Attendance.countDocuments({ branchId: branch._id })
      ]);

      return {
        _id: branch._id,
        name: branch.name,
        totalMembers,
        totalVisitors,
        totalAttendanceRecords
      };
    }));

    const totalMembers = stats.reduce((sum, s) => sum + s.totalMembers, 0);
    const totalVisitors = stats.reduce((sum, s) => sum + s.totalVisitors, 0);
    const totalAttendanceRecords = stats.reduce((sum, s) => sum + s.totalAttendanceRecords, 0);

    res.status(200).json({ 
      success: true, 
      data: {
        summary: {
          totalMembers,
          totalVisitors,
          totalAttendanceRecords,
          totalBranches: branches.length
        },
        branches: stats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
