const express = require('express');
const router = express.Router();
const bidController = require('../controller/bid.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

router.post('/:jobId', authMiddleware, authorizeRoles('freelancer'), bidController.placeBid);
router.get('/:jobId', authMiddleware, bidController.getBidsForJob);
router.patch('/:bidId/accept', authMiddleware, authorizeRoles('client'), bidController.acceptBid);

module.exports = router;
