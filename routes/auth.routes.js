const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/validateotp', authController.validateOtp);

module.exports = router;
