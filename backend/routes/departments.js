const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const branchAccess = require('../middleware/branchAccess');

router.use(protect);
router.use(branchAccess);

router.get('/', async (req, res, next) => {
  try {
    const departments = await Department.find({ branchId: req.branchId }).sort('name');
    res.json({ success: true, data: departments });
  } catch (err) { next(err); }
});

router.post('/', authorize('branch-manager', 'staff'), async (req, res, next) => {
  try {
    const deptData = { ...req.body, branchId: req.branchId };
    const dept = await Department.create(deptData);
    res.status(201).json({ success: true, data: dept });
  } catch (err) { next(err); }
});

router.put('/:id', authorize('branch-manager', 'staff'), async (req, res, next) => {
  try {
    const dept = await Department.findOne({ _id: req.params.id, branchId: req.branchId });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found or access denied.' });
    const updated = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('super-admin', 'branch-manager'), async (req, res, next) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
