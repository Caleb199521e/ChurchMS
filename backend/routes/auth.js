const express = require('express');
const router = express.Router();
const { login, getMe, register, getUsers, updateUser, changePassword } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register', protect, authorize('super-admin'), register);
router.get('/users', protect, authorize('super-admin'), getUsers);
router.put('/users/:id', protect, authorize('super-admin'), updateUser);
router.put('/change-password', protect, changePassword);

module.exports = router;
