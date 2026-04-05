const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  firstVisitDate: { type: Date, default: Date.now },
  invitedBy: { type: String }, // name of member who invited them
  address: { type: String },
  notes: { type: String },
  converted: { type: Boolean, default: false }, // became a full member
  convertedDate: { type: Date },
  convertedMember: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
}, { timestamps: true });

module.exports = mongoose.model('Visitor', VisitorSchema);
