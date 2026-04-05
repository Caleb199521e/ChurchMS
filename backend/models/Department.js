const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String },
  leader: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
