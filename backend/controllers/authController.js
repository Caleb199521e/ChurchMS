const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../middleware/audit');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRE || '7d'
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email }).populate('branchId');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken(user._id);
    
    // Prepare response based on role
    const userResponse = { 
      id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role,
      branchId: user.branchId?._id || user.branchId  // Extract _id if populated, otherwise use as-is
    };

    // For super-admin, include available branches
    if (user.role === 'super-admin') {
      const Branch = require('../models/Branch');
      const branches = await Branch.find({ isActive: true }).select('_id name');
      
      // Log super-admin login
      await logAudit({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        action: 'LOGIN',
        resourceType: 'User',
        resourceId: user._id,
        resourceName: user.name,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS'
      });
      
      return res.json({
        success: true,
        token,
        user: userResponse,
        branches,
        message: 'Please select a branch to manage'
      });
    }

    // For branch staff, branchId is auto-populated
    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  const user = req.user;
  const response = { success: true, user };
  
  // For super-admin, also return available branches
  if (user.role === 'super-admin') {
    const Branch = require('../models/Branch');
    const branches = await Branch.find({ isActive: true }).select('_id name');
    response.branches = branches;
  }
  
  res.json(response);
};

// @desc    Create user (admin only)
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users (admin only)
// @route   GET /api/auth/users
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/auth/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
};
