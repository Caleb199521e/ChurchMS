const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  action: { 
    type: String, 
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ASSIGN_STAFF', 'REMOVE_STAFF'], 
    required: true 
  },
  resourceType: { 
    type: String, 
    enum: ['Branch', 'User', 'Member', 'Department', 'Attendance', 'Announcement', 'Visitor'],
    required: true 
  },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  resourceName: { type: String },
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
  errorMessage: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

// Index for faster queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
