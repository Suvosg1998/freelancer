const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const FileUploader = require('../helper/fileUpload');
const fileUpload = new FileUploader({
    folderName: "uploads", supportedFiles: ["image/png", "image/jpg", "image/jpeg"], fieldSize: 1024 * 1024 * 5
});

router.post('/register', fileUpload.upload().single('photo'), authController.register);
router.post('/login', authController.login);
router.post('/validateotp', authController.validateOtp);
router.post('/resendotp', authController.resendOtp);
router.post('/forgotpassword', authController.forgetPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/updatepassword', authMiddleware, authController.updatePassword);
router.get('/dashboard', authMiddleware, authController.getDashboard);
router.put('/updateprofile', authMiddleware, fileUpload.upload().single('photo'), authController.updateProfile);

module.exports = router;
