const express = require('express');
const { getAuditLogs, getAuditLogsByUser, getAuditLogDetail, getAuditLogsSummary } = require('../controllers/auditController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All audit routes require authentication
router.use(protect);

// @route   GET /api/audit-logs
// @desc    Get all audit logs with pagination and filters
router.get('/', getAuditLogs);

// @route   GET /api/audit-logs/summary/stats
// @desc    Get audit logs summary and statistics
router.get('/summary/stats', getAuditLogsSummary);

// @route   GET /api/audit-logs/:id
// @desc    Get specific audit log details
router.get('/:id', getAuditLogDetail);

// @route   GET /api/audit-logs/user/:userId
// @desc    Get audit logs for specific super-admin
router.get('/user/:userId', getAuditLogsByUser);

module.exports = router;
