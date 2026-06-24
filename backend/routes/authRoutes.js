const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', verifyToken, authController.getProfile);

// Admin User Management Routes
router.get('/admin/users', verifyToken, authController.getAllUsers);
router.post('/admin/users', verifyToken, authController.createUser);
router.put('/admin/users/:id', verifyToken, authController.updateUser);

module.exports = router;
