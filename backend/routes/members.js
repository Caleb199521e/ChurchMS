const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember, getAllMembers, bulkCreateMembers, downloadTemplate, health } = require('../controllers/membersController');
const { protect, authorize } = require('../middleware/auth');

router.get('/health', health); // Health check (no auth)
router.get('/template/download', downloadTemplate); // No auth needed for template download

router.use(protect);

router.get('/all', getAllMembers); // For attendance marking (no pagination)
router.post('/bulk', authorize('admin', 'staff'), bulkCreateMembers); // Bulk upload
router.get('/', getMembers);
router.post('/', authorize('admin', 'staff'), createMember);
router.get('/:id', getMember);
router.put('/:id', authorize('admin', 'staff'), updateMember);
router.delete('/:id', authorize('admin'), deleteMember);

module.exports = router;
