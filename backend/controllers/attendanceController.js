const Attendance = require('../models/Attendance');
const Member = require('../models/Member');

// @desc    Get attendance records
// @route   GET /api/attendance
exports.getAttendance = async (req, res, next) => {
  try {
    const { from, to, serviceType, page = 1, limit = 20 } = req.query;
    const query = {};

    if (serviceType) query.serviceType = serviceType;
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Attendance.countDocuments(query);

    const records = await Attendance.find(query)
      .populate('members', 'fullName')
      .populate('markedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: records.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single attendance record
// @route   GET /api/attendance/:id
exports.getAttendanceRecord = async (req, res, next) => {
  try {
    const record = await Attendance.findById(req.params.id)
      .populate('members', 'fullName phone department')
      .populate('markedBy', 'name');

    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
};

// @desc    Create or update attendance for a service
// @route   POST /api/attendance
exports.markAttendance = async (req, res, next) => {
  try {
    const { date, serviceType, serviceTitle, members, visitors, notes } = req.body;

    // Normalize date to midnight
    const serviceDate = new Date(date);
    serviceDate.setHours(0, 0, 0, 0);

    // Upsert - if attendance exists for this service+date, update it
    const record = await Attendance.findOneAndUpdate(
      { date: serviceDate, serviceType },
      { serviceTitle, members, visitors, notes, markedBy: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: record, message: 'Attendance saved.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res, next) => {
  try {
    const record = await Attendance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found.' });
    res.json({ success: true, message: 'Record deleted.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get attendance summary (count per service)
// @route   GET /api/attendance/summary
exports.getAttendanceSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const matchQuery = {};

    if (from || to) {
      matchQuery.date = {};
      if (from) matchQuery.date.$gte = new Date(from);
      if (to) matchQuery.date.$lte = new Date(to);
    }

    const summary = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $project: {
          date: 1,
          serviceType: 1,
          memberCount: { $size: '$members' },
          visitorCount: { $size: '$visitors' }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
};
