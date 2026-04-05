const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  address: { type: String },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Branch', BranchSchema);
