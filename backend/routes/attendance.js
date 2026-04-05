const express = require('express');
const router = express.Router();
const { getAttendance, getAttendanceRecord, markAttendance, deleteAttendance, getAttendanceSummary } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const branchAccess = require('../middleware/branchAccess');

router.use(protect);
router.use(branchAccess);

router.get('/summary', getAttendanceSummary);
router.get('/', getAttendance);
router.post('/', markAttendance);
router.get('/:id', getAttendanceRecord);
router.delete('/:id', authorize('super-admin', 'branch-manager'), deleteAttendance);

module.exports = router;
