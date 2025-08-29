// routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Middleware to ensure JSON responses
const ensureJSON = (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
};

// Middleware for request logging
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  console.log('Query params:', req.query);
  console.log('Headers:', {
    'user-agent': req.get('user-agent'),
    'x-forwarded-for': req.get('x-forwarded-for'),
    'x-real-ip': req.get('x-real-ip')
  });
  next();
};

// Error handling middleware
const handleAsyncErrors = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Apply middleware to all routes
router.use(ensureJSON);
router.use(logRequest);

// Enhanced job routes
router.get('/jobs', handleAsyncErrors(jobController.getAllJobs));
router.get('/jobs/stats', handleAsyncErrors(jobController.getJobStats));
router.get('/jobs/near', handleAsyncErrors(jobController.getJobsNearLocation));
router.get('/jobs/:id', handleAsyncErrors(jobController.getJob));
router.post('/jobs', handleAsyncErrors(jobController.createJob));
router.put('/jobs/:id', handleAsyncErrors(jobController.updateJob));
router.delete('/jobs', handleAsyncErrors(jobController.deleteJob));

// Location-specific routes
router.post('/jobs/update-locations', handleAsyncErrors(jobController.updateJobLocations));
router.post('/jobs/accept', handleAsyncErrors(jobController.acceptJob));
router.post('/jobs/reject', handleAsyncErrors(jobController.rejectJob));
router.post('/jobs/apply', handleAsyncErrors(jobController.applyJob));
router.post('/jobs/fetch-status', handleAsyncErrors(jobController.fetchStatus));
router.patch('/jobs/:id/toggle-pin', handleAsyncErrors(jobController.toggleJobPinned));

// Global error handler
router.use((error, req, res, next) => {
  console.error('Job route error:', error);
  
  // Ensure we always send JSON
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;