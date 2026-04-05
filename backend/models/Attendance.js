const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  serviceType: {
    type: String,
    enum: ['sunday', 'midweek', 'special', 'prayer'],
    required: true
  },
  serviceTitle: { type: String }, // e.g. "Easter Sunday", "Youth Night"
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }],
  visitors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visitor' }],
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

// Prevent duplicate attendance for same service on same day per branch
AttendanceSchema.index({ date: 1, serviceType: 1, branchId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
