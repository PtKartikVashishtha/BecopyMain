const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminAuth } = require('../middleware/auth');

// Public routes
router.post('/login', adminController.login);
router.post('/register', adminController.register);
// Protected routes
router.use(adminAuth);
router.get('/profile', adminController.getProfile);
router.put('/profile', adminController.updateProfile);

// router.get('/stats', adminController.getStats);
// router.get('/programs', adminController.getPrograms);
// router.post('/programs', adminController.createProgram);
// router.put('/programs/:id', adminController.updateProgram);
// router.delete('/programs/:id', adminController.deleteProgram);

// Add more routes as needed


module.exports = router; 