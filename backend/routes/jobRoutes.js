// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const advancedResults = require('../middleware/advancedResults');
const Job = require('../models/jobModel');
const {
  jobValidationMiddleware,
  corsMiddleware,
  validateJobData,
  formatJobResponse,
  errorHandlingMiddleware
} = require('../middleware/jobMiddleware');

// Apply middleware to all routes
router.use(corsMiddleware);
router.use(jobValidationMiddleware);
router.use(formatJobResponse);

// Public routes
router.get('/', advancedResults(Job, 'recruiter'), jobController.getAllJobs);
router.get('/:id', jobController.getJob);

// Protected routes (uncomment when auth is ready)
// router.use(protect);
router.post('/new', validateJobData, jobController.createJob);
router.put('/:id', validateJobData, jobController.updateJob);

// Admin routes (uncomment when auth is ready)
// router.use(adminAuth);
router.patch('/:id/status', jobController.updateJobStatus);
router.patch('/:id/toggle-pin', jobController.toggleJobPinned);
router.post('/accept', jobController.acceptJob);
router.post('/reject', jobController.rejectJob);
router.post('/delete', jobController.deleteJob);
router.post('/status', jobController.fetchStatus);

// Error handling middleware (must be last)
router.use(errorHandlingMiddleware);

module.exports = router;