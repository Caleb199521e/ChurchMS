const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const branchAccess = require('../middleware/branchAccess');
const { auditMiddleware } = require('../middleware/audit');
const {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  assignStaffToBranch,
  getBranchStaff,
  removeStaffFromBranch
} = require('../controllers/branchController');

const router = express.Router();

// All branch routes require authentication
router.use(protect);

// Super Admin only routes
router.get('/', authorize('super-admin'), getBranches);
router.post('/', authorize('super-admin'), auditMiddleware('CREATE', 'Branch'), createBranch);
router.delete('/:id', authorize('super-admin'), auditMiddleware('DELETE', 'Branch'), deleteBranch);

// Branch-level routes (can be accessed by super-admin and branch manager/staff of that branch)
router.get('/:id', branchAccess, getBranch);
router.put('/:id', branchAccess, auditMiddleware('UPDATE', 'Branch'), updateBranch);

// Staff management
router.post('/:id/staff', branchAccess, auditMiddleware('ASSIGN_STAFF', 'Branch'), assignStaffToBranch);
router.get('/:id/staff', branchAccess, getBranchStaff);
router.delete('/:id/staff/:userId', branchAccess, auditMiddleware('REMOVE_STAFF', 'Branch'), removeStaffFromBranch);

module.exports = router;
