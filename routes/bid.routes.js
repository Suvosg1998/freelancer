const express = require('express');
const router = express.Router();
const bidController = require('../controller/bid.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

router.post('/:jobId', authMiddleware, authorizeRoles('freelancer'), bidController.placeBid);
router.get('/client', authMiddleware, authorizeRoles('client'), bidController.getBidsForClientJobs);
router.get('/:jobId', authMiddleware, authorizeRoles('client'), bidController.getBidsForJob);
router.patch('/:bidId/accept', authMiddleware, authorizeRoles('client'), bidController.acceptBid);
router.patch('/:bidId/reject', authMiddleware, authorizeRoles('client'), bidController.rejectBid);

module.exports = router;
