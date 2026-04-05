const express = require('express');
const router = express.Router();
const { getAttendance, getAttendanceRecord, markAttendance, deleteAttendance, getAttendanceSummary } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/summary', getAttendanceSummary);
router.get('/', getAttendance);
router.post('/', markAttendance);
router.get('/:id', getAttendanceRecord);
router.delete('/:id', authorize('admin'), deleteAttendance);

module.exports = router;
