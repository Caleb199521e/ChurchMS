const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getAttendanceTrend,
  getBranchGrowth,
  compareBranches,
  getAnalyticsStats
} = require('../controllers/analyticsController');

const router = express.Router();

// All analytics routes require super-admin authentication
router.use(protect);
router.use(authorize('super-admin'));

// Analytics endpoints
router.get('/stats', getAnalyticsStats);
router.get('/attendance-trend', getAttendanceTrend);
router.get('/growth', getBranchGrowth);
router.get('/compare', compareBranches);

module.exports = router;
