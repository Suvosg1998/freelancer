const express = require('express');
const router = express.Router();
const jobController = require('../controller/job.controller');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

router.post('/', authMiddleware, authorizeRoles('client'), jobController.createJob);
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJobById);
router.put('/:id', authMiddleware, authorizeRoles('client'), jobController.updateJob);
router.delete('/:id', authMiddleware, authorizeRoles('client'), jobController.deleteJob);

module.exports = router;
