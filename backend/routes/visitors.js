const express = require('express');
const router = express.Router();
const { getVisitors, createVisitor, updateVisitor, deleteVisitor, convertToMember, downloadTemplate, bulkCreateVisitors } = require('../controllers/visitorsController');
const { protect, authorize } = require('../middleware/auth');
const branchAccess = require('../middleware/branchAccess');

router.get('/template/download', downloadTemplate); // No auth needed for template download

router.use(protect);
router.use(branchAccess);

router.get('/', getVisitors);
router.post('/', createVisitor);
router.post('/bulk', authorize('branch-manager', 'staff'), bulkCreateVisitors); // Bulk upload
router.put('/:id', updateVisitor);
router.post('/:id/convert', authorize('branch-manager', 'staff'), convertToMember);
router.delete('/:id', authorize('super-admin', 'branch-manager'), deleteVisitor);

module.exports = router;
