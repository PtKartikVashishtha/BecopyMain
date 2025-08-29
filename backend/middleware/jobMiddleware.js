// middleware/jobMiddleware.js - Custom middleware for job operations

// Logging middleware
const jobValidationMiddleware = (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params,
  });
  next();
};

// CORS middleware
const corsMiddleware = (req, res, next) => {
  res.header(
    'Access-Control-Allow-Origin',
    process.env.FRONTEND_URL || 'http://localhost:3000'
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

// Error handler
const errorHandlingMiddleware = (err, req, res, next) => {
  console.error('Job API Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
  });

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.details,
    }),
  });
};

// Input validation for job creation/updates
// Input validation for job creation/updates
const validateJobData = (req, res, next) => {
  if (req.method === 'POST' && req.path === '/new') {
    const { company, title, deadline } = req.body;

    if (!company || !title || !deadline) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Company, title, and deadline are required',
        received: { company: !!company, title: !!title, deadline: !!deadline },
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deadline format',
        message: 'Deadline must be a valid date',
      });
    }

    if (deadlineDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deadline',
        message: 'Deadline must be in the future',
      });
    }

    // ✅ New location parsing logic
    if (req.body.jobLocation && !req.body.latitude && !req.body.longitude) {
      try {
        const { parseLocationText } = require('../utils/locationUtils');
        const parsed = parseLocationText(req.body.jobLocation);

        if (parsed) {
          req.body.city = parsed.city;
          req.body.region = parsed.region;
          req.body.countryCode = parsed.countryCode;
        }
      } catch (err) {
        console.warn('Location parsing failed:', err.message);
      }
    }
  }

  next();
};


// Response formatting middleware
const formatJobResponse = (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    let responseData = data;
    if (typeof data === 'string') {
      try {
        responseData = JSON.parse(data);
      } catch (e) {
        return originalSend.call(this, data);
      }
    }

    if (responseData && responseData.data && Array.isArray(responseData.data)) {
      responseData.metadata = {
        timestamp: new Date().toISOString(),
        count: responseData.data.length,
        endpoint: req.path,
      };
    }

    return originalSend.call(this, JSON.stringify(responseData));
  };

  next();
};

// New: IP location middleware
const ipLocationMiddleware = (req, res, next) => {
  if (!req.clientIP || req.clientIP === '127.0.0.1') {
    console.warn('Local IP detected, location detection may not work');
  }
  next();
};

// ✅ Single merged export
module.exports = {
  jobValidationMiddleware,
  corsMiddleware,
  validateJobData,
  formatJobResponse,
  errorHandlingMiddleware,
  ipLocationMiddleware,
};
