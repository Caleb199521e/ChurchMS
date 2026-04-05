const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
}, { timestamps: true });

// Departments are unique per branch
DepartmentSchema.index({ name: 1, branchId: 1 }, { unique: true });

module.exports = mongoose.model('Department', DepartmentSchema);
