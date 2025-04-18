const express = require('express');
const router = express.Router();
const messageController = require('../controller/message.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.post('/', authMiddleware, messageController.sendMessage);
router.get('/:jobId', authMiddleware, messageController.getMessages);

module.exports = router;
