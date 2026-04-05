const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Visitor = require('../models/Visitor');

// @desc    Get dashboard stats
// @route   GET /api/dashboard
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalMembers,
      todayAttendance,
      recentVisitors,
      latestAnnouncements,
      newMembersThisMonth
    ] = await Promise.all([
      Member.countDocuments({ isActive: true }),

      Attendance.findOne({ date: today }).select('members serviceType serviceTitle'),

      Visitor.find({ converted: false })
        .sort({ firstVisitDate: -1 })
        .limit(5)
        .select('name phone firstVisitDate'),

      Announcement.find({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }]
      })
        .sort({ priority: -1, createdAt: -1 })
        .limit(3)
        .select('title message priority createdAt'),

      Member.countDocuments({
        isActive: true,
        joinDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalMembers,
        todayAttendanceCount: todayAttendance ? todayAttendance.members.length : 0,
        todayService: todayAttendance,
        recentVisitors,
        latestAnnouncements,
        newMembersThisMonth
      }
    });
  } catch (err) {
    next(err);
  }
};
