const express = require('express');
const router = express.Router();
const { getVisitors, createVisitor, updateVisitor, deleteVisitor, convertToMember, downloadTemplate, bulkCreateVisitors } = require('../controllers/visitorsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/template/download', downloadTemplate); // No auth needed for template download

router.use(protect);

router.get('/', getVisitors);
router.post('/', createVisitor);
router.post('/bulk', authorize('admin', 'staff'), bulkCreateVisitors); // Bulk upload
router.put('/:id', updateVisitor);
router.post('/:id/convert', authorize('admin', 'staff'), convertToMember);
router.delete('/:id', authorize('admin'), deleteVisitor);

module.exports = router;
