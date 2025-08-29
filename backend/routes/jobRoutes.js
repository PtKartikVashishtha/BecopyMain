// backend/routes/jobRoutes.js
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

// CORS middleware
const corsMiddleware = (req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    process.env.FRONTEND_URL || 'http://localhost:4000'
  );
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
};

// Apply middleware to all routes
router.use(corsMiddleware);
router.use(ensureJSON); 
router.use(logRequest);

// Enhanced job routes
router.get('/', handleAsyncErrors(jobController.getAllJobs));
router.get('/stats', handleAsyncErrors(jobController.getJobStats));
router.get('/near', handleAsyncErrors(jobController.getJobsNearLocation));
router.get('/:id', handleAsyncErrors(jobController.getJob));
router.post('/', handleAsyncErrors(jobController.createJob));
router.put('/:id', handleAsyncErrors(jobController.updateJob));
router.delete('/', handleAsyncErrors(jobController.deleteJob));

// Location-specific routes
router.post('/update-locations', handleAsyncErrors(jobController.updateJobLocations));
router.post('/accept', handleAsyncErrors(jobController.acceptJob));
router.post('/reject', handleAsyncErrors(jobController.rejectJob));
router.post('/apply', handleAsyncErrors(jobController.applyJob));
router.post('/fetch-status', handleAsyncErrors(jobController.fetchStatus));
router.patch('/:id/toggle-pin', handleAsyncErrors(jobController.toggleJobPinned));

// Global error handler
router.use((error, req, res, next) => {
  console.error('Job route error:', error);
  
  // Ensure we always send JSON
  if (!res.headersSent) {
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;