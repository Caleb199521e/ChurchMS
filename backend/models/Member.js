const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  role: {
    type: String,
    enum: ['member', 'deacon', 'elder', 'pastor', 'leader', 'worker'],
    default: 'member'
  },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: { type: Date },
  address: { type: String },
  joinDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  notes: { type: String },
}, { timestamps: true });

// Text index for search and branch filtering
MemberSchema.index({ fullName: 'text', phone: 'text', email: 'text' });
MemberSchema.index({ branchId: 1 });

module.exports = mongoose.model('Member', MemberSchema);
