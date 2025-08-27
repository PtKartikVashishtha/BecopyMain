// middleware/jobMiddleware.js - Custom middleware for job operations

const jobValidationMiddleware = (req, res, next) => {
  // Add request logging for debugging
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params
  });
  
  next();
};

const corsMiddleware = (req, res, next) => {
  // Set CORS headers for job API
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
};

const errorHandlingMiddleware = (err, req, res, next) => {
  console.error('Job API Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  // Return standardized error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details 
    })
  });
};

// Input validation for job creation/updates
const validateJobData = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/new') {
    const { company, title, deadline } = req.body;
    
    if (!company || !title || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Company, title, and deadline are required',
        received: { company: !!company, title: !!title, deadline: !!deadline }
      });
    }
    
    // Validate deadline format
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deadline format',
        message: 'Deadline must be a valid date'
      });
    }
    
    // Check if deadline is in the future
    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deadline',
        message: 'Deadline must be in the future'
      });
    }
  }
  
  next();
};

// Response formatting middleware
const formatJobResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Parse data if it's a string
    let responseData = data;
    if (typeof data === 'string') {
      try {
        responseData = JSON.parse(data);
      } catch (e) {
        return originalSend.call(this, data);
      }
    }
    
    // Add metadata for job responses
    if (responseData && responseData.data && Array.isArray(responseData.data)) {
      responseData.metadata = {
        timestamp: new Date().toISOString(),
        count: responseData.data.length,
        endpoint: req.path
      };
    }
    
    return originalSend.call(this, JSON.stringify(responseData));
  };
  
  next();
};

module.exports = {
  jobValidationMiddleware,
  corsMiddleware,
  errorHandlingMiddleware,
  validateJobData,
  formatJobResponse
};

// Updated job routes with middleware
