const express = require('express');
const router = express.Router();
const { getMembers, getMember, createMember, updateMember, deleteMember, getAllMembers, bulkCreateMembers, downloadTemplate, health } = require('../controllers/membersController');
const { protect, authorize } = require('../middleware/auth');
const branchAccess = require('../middleware/branchAccess');

router.get('/health', health); // Health check (no auth)
router.get('/template/download', downloadTemplate); // No auth needed for template download

router.use(protect);
router.use(branchAccess);

router.get('/all', getAllMembers); // For attendance marking (no pagination)
router.post('/bulk', authorize('branch-manager', 'staff'), bulkCreateMembers); // Bulk upload
router.get('/', getMembers);
router.post('/', authorize('branch-manager', 'staff'), createMember);
router.get('/:id', getMember);
router.put('/:id', authorize('branch-manager', 'staff'), updateMember);
router.delete('/:id', authorize('super-admin', 'branch-manager'), deleteMember);

module.exports = router;
