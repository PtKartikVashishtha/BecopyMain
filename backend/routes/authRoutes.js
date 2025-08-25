const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const { protect } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/sendResetCode', authController.sendResetCode)
router.post('/matchCode', authController.matchCode)
router.post('/resetPass', authController.resetPass)
router.post('/sendVerifyLink', authController.sendVerifyLink)
router.post('/verifyEmail', authController.verifyEmail)
router.get('/me', authController.getMe);

module.exports = router; 