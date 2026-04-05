const express = require('express');
const router = express.Router();
const { login, getMe, register, getUsers, updateUser, changePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register', protect, authorize('admin'), register);
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id', protect, authorize('admin'), updateUser);
router.put('/change-password', protect, changePassword);

module.exports = router;
