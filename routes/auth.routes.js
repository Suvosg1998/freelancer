const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/validateotp', authController.validateOtp);
router.post('/forgotpassword', authController.forgetPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/updatepassword', authMiddleware, authController.updatePassword);

module.exports = router;
