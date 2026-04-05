const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('admin', 'staff'), createAnnouncement);
router.put('/:id', authorize('admin', 'staff'), updateAnnouncement);
router.delete('/:id', authorize('admin'), deleteAnnouncement);

module.exports = router;
