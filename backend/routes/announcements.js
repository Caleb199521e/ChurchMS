const express = require('express');
const router = express.Router();
const { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementsController');
const { protect, authorize } = require('../middleware/auth');
const branchAccess = require('../middleware/branchAccess');

router.use(protect);
router.use(branchAccess);

router.get('/', getAnnouncements);
router.post('/', authorize('branch-manager', 'staff'), createAnnouncement);
router.put('/:id', authorize('branch-manager', 'staff'), updateAnnouncement);
router.delete('/:id', authorize('super-admin', 'branch-manager'), deleteAnnouncement);

module.exports = router;
