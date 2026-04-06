const Branch = require('../models/Branch');
const User = require('../models/User');
const { logAudit, getChanges } = require('../middleware/audit');

// @desc    Get all branches (super-admin) or user's branch
// @route   GET /api/branches
// @access  Super Admin
exports.getBranches = async (req, res) => {
  try {
    const user = req.user;

    // Only super-admin can list all branches
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can list all branches' 
      });
    }

    const branches = await Branch.find()
      .populate('manager', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single branch with stats
// @route   GET /api/branches/:id
// @access  Super Admin, Branch Manager
exports.getBranch = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const branch = await Branch.findById(id)
      .populate('manager', 'name email')
      .populate('createdBy', 'name email');

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check access rights
    if (user.role !== 'super-admin' && user.branchId.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your assigned branch' 
      });
    }

    // Get branch statistics
    const Member = require('../models/Member');
    const Visitor = require('../models/Visitor');
    const User = require('../models/User');

    const [memberCount, visitorCount, staffCount, departmentCount] = await Promise.all([
      Member.countDocuments({ branchId: id, isActive: true }),
      Visitor.countDocuments({ branchId: id }),
      User.countDocuments({ branchId: id, isActive: true, role: { $ne: 'member' } }),
      (require('../models/Department')).countDocuments({ branchId: id })
    ]);

    const branchData = branch.toObject();
    branchData.stats = {
      members: memberCount,
      visitors: visitorCount,
      staff: staffCount,
      departments: departmentCount
    };

    res.status(200).json({ success: true, data: branchData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new branch
// @route   POST /api/branches
// @access  Super Admin
exports.createBranch = async (req, res) => {
  try {
    const user = req.user;
    const { name, email, phone, address, manager } = req.body;

    // Only super-admin can create branches
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can create branches' 
      });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch name is required' 
      });
    }

    // Check if branch already exists
    const existingBranch = await Branch.findOne({ name });
    if (existingBranch) {
      return res.status(400).json({ 
        success: false, 
        message: 'Branch with this name already exists' 
      });
    }

    // If manager provided, validate it's a user
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(404).json({ 
          success: false, 
          message: 'Manager user not found' 
        });
      }
      
      // Update manager's role and branchId
      managerUser.role = 'branch-manager';
      managerUser.branchId = null; // Will be updated after branch creation
      await managerUser.save();
    }

    const branch = new Branch({
      name,
      email,
      phone,
      address,
      manager,
      createdBy: user._id
    });

    await branch.save();

    // Update manager's branchId after branch is created
    if (manager) {
      await User.findByIdAndUpdate(manager, { branchId: branch._id });
    }

    const populatedBranch = await Branch.findById(branch._id)
      .populate('manager', 'name email')
      .populate('createdBy', 'name email');

    // Log audit
    if (req.auditLog) {
      await logAudit({
        ...req.auditLog,
        resourceId: branch._id,
        resourceName: name,
        changes: {
          before: null,
          after: { name, email, phone, address, manager }
        },
        status: 'SUCCESS'
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Branch created successfully',
      data: populatedBranch 
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update branch
// @route   PUT /api/branches/:id
// @access  Super Admin, Branch Manager (own branch only)
exports.updateBranch = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { name, email, phone, address, isActive } = req.body;

    let branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check access rights
    if (user.role !== 'super-admin' && user.branchId.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only update your assigned branch' 
      });
    }

    // Only super-admin can change isActive status
    if (user.role !== 'super-admin' && isActive !== undefined) {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can change branch status' 
      });
    }

    // Update allowed fields
    if (name) branch.name = name;
    if (email) branch.email = email;
    if (phone) branch.phone = phone;
    if (address) branch.address = address;
    if (isActive !== undefined) branch.isActive = isActive;

    // Capture changes before saving
    const changes = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(isActive !== undefined && { isActive })
    };

    await branch.save();

    const populatedBranch = await Branch.findById(id)
      .populate('manager', 'name email')
      .populate('createdBy', 'name email');

    // Log audit
    if (req.auditLog && user.role === 'super-admin') {
      await logAudit({
        ...req.auditLog,
        action: 'UPDATE',
        resourceId: id,
        resourceName: branch.name,
        changes: {
          before: { name: branch.name },
          after: changes
        },
        status: 'SUCCESS'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Branch updated successfully',
      data: populatedBranch 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign staff to branch
// @route   POST /api/branches/:id/staff
// @access  Super Admin (for any branch), Branch Manager (for own branch)
exports.assignStaffToBranch = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check access rights
    if (user.role !== 'super-admin' && user.branchId.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only assign staff to your branch' 
      });
    }

    const staffUser = await User.findById(userId);
    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // User must be staff role (or will be converted)
    if (!['staff', 'branch-manager'].includes(staffUser.role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only staff can be assigned to branches' 
      });
    }

    // Assign to branch
    staffUser.branchId = id;
    staffUser.role = 'staff';
    await staffUser.save();

    // Log audit
    if (req.auditLog && user.role === 'super-admin') {
      await logAudit({
        ...req.auditLog,
        action: 'ASSIGN_STAFF',
        resourceId: id,
        resourceName: branch.name,
        changes: {
          before: { branchId: staffUser.branchId },
          after: { branchId: id, role: 'staff' }
        },
        status: 'SUCCESS'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Staff assigned to branch successfully',
      data: staffUser 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get staff in branch
// @route   GET /api/branches/:id/staff
// @access  Super Admin, Branch Manager
exports.getBranchStaff = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check access rights
    if (user.role !== 'super-admin' && user.branchId.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view staff in your branch' 
      });
    }

    const staff = await User.find({ 
      branchId: id, 
      role: { $in: ['staff', 'branch-manager'] },
      isActive: true 
    }).select('-password');

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove staff from branch
// @route   DELETE /api/branches/:id/staff/:userId
// @access  Super Admin, Branch Manager
exports.removeStaffFromBranch = async (req, res) => {
  try {
    const user = req.user;
    const { id, userId } = req.params;

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Check access rights
    if (user.role !== 'super-admin' && user.branchId.toString() !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only remove staff from your branch' 
      });
    }

    const staffUser = await User.findById(userId);
    if (!staffUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove from branch
    staffUser.branchId = null;
    await staffUser.save();

    // Log audit
    if (req.auditLog && user.role === 'super-admin') {
      await logAudit({
        ...req.auditLog,
        action: 'REMOVE_STAFF',
        resourceId: id,
        resourceName: branch.name,
        changes: {
          before: { branchId: id },
          after: { branchId: null }
        },
        status: 'SUCCESS'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Staff removed from branch successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get members in branch
// @route   GET /api/branches/:id/members
// @access  Super Admin
exports.getBranchMembers = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only super-admin can view all members across branches
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can view members across branches' 
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const Member = require('../models/Member');
    const members = await Member.find({ 
      branchId: id, 
      isActive: true 
    }).select('fullName phone email role department');

    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign member to branch
// @route   POST /api/branches/:id/members
// @access  Super Admin
exports.assignMemberToBranch = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { memberId } = req.body;

    // Only super-admin can assign members
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can assign members to branches' 
      });
    }

    if (!memberId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Member ID is required' 
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const Member = require('../models/Member');
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const oldBranchId = member.branchId;

    // Assign to branch
    member.branchId = id;
    await member.save();

    // Log audit
    if (req.auditLog) {
      await logAudit({
        ...req.auditLog,
        action: 'UPDATE',
        resourceType: 'Member',
        resourceId: memberId,
        resourceName: member.fullName,
        changes: {
          before: { branchId: oldBranchId },
          after: { branchId: id }
        },
        status: 'SUCCESS'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Member assigned to branch successfully',
      data: member 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete branch and all related data
// @route   DELETE /api/branches/:id
// @access  Super Admin
exports.deleteBranch = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only super-admin can delete branches
    if (user.role !== 'super-admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only super-admin can delete branches' 
      });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const branchName = branch.name;

    // Delete all related data
    const Member = require('../models/Member');
    const Visitor = require('../models/Visitor');
    const Department = require('../models/Department');
    const Attendance = require('../models/Attendance');
    const Announcement = require('../models/Announcement');

    // Delete branch data
    await Member.deleteMany({ branchId: id });
    await Visitor.deleteMany({ branchId: id });
    await Department.deleteMany({ branchId: id });
    await Attendance.deleteMany({ branchId: id });
    await Announcement.deleteMany({ branchId: id });

    // Update users assigned to this branch
    await User.updateMany(
      { branchId: id },
      { branchId: null }
    );

    // Delete the branch
    await Branch.findByIdAndDelete(id);

    // Log audit
    if (req.auditLog) {
      await logAudit({
        ...req.auditLog,
        resourceId: id,
        resourceName: branchName,
        changes: {
          before: { branchId: id, name: branchName },
          after: null
        },
        status: 'SUCCESS'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Branch deleted successfully with all related data' 
    });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
