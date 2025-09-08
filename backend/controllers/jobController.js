const Job = require('../models/jobModel');
const Contributor = require('../models/contributorModel');
const Recruiter = require('../models/recruiterModel');
const tmp = require('tmp');
const fs = require('fs');
const transporter = require('../utils/sendMailer');
const axios = require('axios');
const mongoose = require('mongoose');

// IP-based location detection utility
function getClientIp(req) {
  let ip = 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
    req.headers['x-real-ip'] || 
    req.connection?.remoteAddress || 
    req.socket?.remoteAddress || 
    (req.connection?.socket ? req.connection.socket.remoteAddress : null);

  // Normalize IPv6 localhost (::1) and IPv4-mapped addresses
  if (ip === '::1') ip = '127.0.0.1';
  if (ip?.startsWith('::ffff:')) ip = ip.substring(7);

  return ip;
}

const getLocationFromIP = async (ipAddress) => {
  try {
    // Skip localhost
    if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
      console.log('Localhost detected, skipping IP location detection');
      return null;
    }

    console.log('Detecting location for IP:', ipAddress);

    // Primary API - ipwho.is
    const response = await axios.get(`https://ipwho.is/${ipAddress}`, {
      timeout: 10000
    });

    if (response.data && response.data.success !== false && response.data.latitude) {
      const locationData = {
        country: response.data.country,
        countryCode: response.data.country_code,
        region: response.data.region,
        city: response.data.city,
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
        timezone: response.data.timezone?.id,
        accuracy: 50,
        source: 'ipwho.is'
      };
      console.log('Location detected:', locationData);
      return locationData;
    }

    // Fallback API - ipapi.co
    const fallbackResponse = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 10000
    });

    if (fallbackResponse.data && fallbackResponse.data.country_name && fallbackResponse.data.latitude) {
      const locationData = {
        country: fallbackResponse.data.country_name,
        countryCode: fallbackResponse.data.country_code,
        region: fallbackResponse.data.region,
        city: fallbackResponse.data.city,
        latitude: parseFloat(fallbackResponse.data.latitude),
        longitude: parseFloat(fallbackResponse.data.longitude),
        timezone: fallbackResponse.data.timezone,
        accuracy: 20,
        source: 'ipapi.co'
      };
      console.log('Location detected via fallback:', locationData);
      return locationData;
    }

    console.log('No location data found for IP:', ipAddress);
    return null;
  } catch (error) {
    console.error('IP location detection failed:', error.message);
    return null;
  }
};

// Enhanced getAllJobs with geo filtering
exports.getAllJobs = async (req, res) => {
  try {
    const isAll = req.query?.all;
    const { lat, lng, radius = 250, geoMode, userCountry, userCity } = req.query;
    
    console.log('getAllJobs called with params:', { lat, lng, radius, geoMode, userCountry, userCity });
    
    let filterData;
    if (isAll === 'true') {
      filterData = {};
    } else {
      filterData = { isVisible: { $ne: false } };
    }

    // Build aggregation pipeline for geo filtering
    let pipeline = [
      { $match: filterData },
      {
        $lookup: {
          from: 'recruiters',
          localField: 'recruiter',
          foreignField: '_id',
          as: 'recruiter'
        }
      },
      { $unwind: { path: '$recruiter', preserveNullAndEmptyArrays: true } }
    ];

    // Add geo filtering if coordinates and geoMode provided
    if (geoMode === 'true' && lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusKm = parseFloat(radius);

      console.log('Applying geo filter:', { userLat, userLng, radiusKm });

      // Add distance calculation and filtering
      pipeline.push(
        {
          $addFields: {
            distance: {
              $cond: {
                if: {
                  $and: [
                    { $ne: ['$latitude', null] },
                    { $ne: ['$longitude', null] },
                    { $ne: ['$latitude', 0] },
                    { $ne: ['$longitude', 0] }
                  ]
                },
                then: {
                  $multiply: [
                    6371, // Earth's radius in km
                    {
                      $acos: {
                        $max: [
                          -1,
                          {
                            $min: [
                              1,
                              {
                                $add: [
                                  {
                                    $multiply: [
                                      { $sin: { $multiply: [{ $divide: [userLat, 180] }, Math.PI] } },
                                      { $sin: { $multiply: [{ $divide: ['$latitude', 180] }, Math.PI] } }
                                    ]
                                  },
                                  {
                                    $multiply: [
                                      { $cos: { $multiply: [{ $divide: [userLat, 180] }, Math.PI] } },
                                      { $cos: { $multiply: [{ $divide: ['$latitude', 180] }, Math.PI] } },
                                      { $cos: { $multiply: [{ $divide: [{ $subtract: ['$longitude', userLng] }, 180] }, Math.PI] } }
                                    ]
                                  }
                                ]
                              }
                            ]
                          }
                        ]
                      }
                    }
                  ]
                },
                else: 999999 // Large distance for jobs without coordinates
              }
            }
          }
        },
        {
          $match: {
            $or: [
              { distance: { $lte: radiusKm } }, // Include jobs within radius
              // Text-based location matching for jobs without coordinates
              {
                $and: [
                  {
                    $or: [
                      { latitude: { $in: [null, 0] } },
                      { longitude: { $in: [null, 0] } }
                    ]
                  },
                  {
                    $or: [
                      { country: { $regex: new RegExp(userCountry || '', 'i') } },
                      { jobLocation: { $regex: new RegExp(userCity || '', 'i') } },
                      { city: { $regex: new RegExp(userCity || '', 'i') } }
                    ]
                  }
                ]
              }
            ]
          }
        }
      );
    }

    // Sort by distance if geo mode is active, otherwise by creation date
    if (geoMode === 'true' && lat && lng) {
      pipeline.push({ $sort: { distance: 1, isPinned: -1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { isPinned: -1, createdAt: -1 } });
    }

    const jobs = await Job.aggregate(pipeline);
    
    console.log(`Jobs found: ${jobs.length}${geoMode === 'true' ? ` within ${radius}km` : ' globally'}`);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
      geoFiltered: geoMode === 'true',
      userLocation: geoMode === 'true' ? { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) } : null
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single job
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiter', 'name companyName companyLogo email');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Increment view count
    await Job.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Enhanced createJob with proper user/recruiter mapping
exports.createJob = async (req, res) => {
  try {
    console.log('=== JOB CREATION REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);

    // Enhanced validation - check all required fields
    const requiredFields = ['title', 'company', 'deadline'];
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        details: 'Please provide all required fields'
      });
    }

    // Validate field lengths and formats
    const validationErrors = [];
    
    if (req.body.title && req.body.title.length > 200) {
      validationErrors.push('Title must be less than 200 characters');
    }
    
    if (req.body.company && req.body.company.length > 100) {
      validationErrors.push('Company name must be less than 100 characters');
    }
    
    if (req.body.description && req.body.description.length > 5000) {
      validationErrors.push('Description must be less than 5000 characters');
    }

    // Validate deadline format and future date
    const deadlineDate = new Date(req.body.deadline);
    if (isNaN(deadlineDate.getTime())) {
      validationErrors.push('Invalid deadline format');
    } else if (deadlineDate <= new Date()) {
      validationErrors.push('Deadline must be a future date');
    }

    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // CORRECTED LOGIC: Handle User ID to Recruiter ID mapping
    let recruiterId = null;
    if (req.body.recruiter) {
      try {
        const recruiterIdToCheck = req.body.recruiter.trim();
        
        console.log('Validating recruiter ID:', recruiterIdToCheck);
        
        // Check if it's a valid ObjectId format first
        if (!mongoose.Types.ObjectId.isValid(recruiterIdToCheck)) {
          console.log('Invalid ObjectId format:', recruiterIdToCheck);
          return res.status(400).json({
            success: false,
            error: 'Invalid recruiter ID format',
            details: 'Recruiter ID must be a valid MongoDB ObjectId'
          });
        }
        
        // CORRECTED LOGIC: Check if the provided ID is a User ID or Recruiter ID
        // First, try to find recruiter by the provided ID directly
        let recruiterExists = await Recruiter.findById(recruiterIdToCheck);
        
        if (recruiterExists) {
          // Direct recruiter ID match
          console.log('Direct recruiter found:', {
            recruiterId: recruiterExists._id,
            recruiterName: recruiterExists.name || 'No name',
            recruiterEmail: recruiterExists.email || 'No email'
          });
          recruiterId = recruiterExists._id;
        } else {
          // Not found as recruiter ID, check if it's a User ID
          console.log('No direct recruiter found, checking if this is a User ID...');
          
          // Try to find recruiter by userId field (which maps to user._id)
          const recruiterByUserId = await Recruiter.findOne({ userId: recruiterIdToCheck });
          
          if (recruiterByUserId) {
            console.log('Found recruiter by userId mapping:', {
              userId: recruiterIdToCheck,
              recruiterId: recruiterByUserId._id,
              recruiterName: recruiterByUserId.name || 'No name',
              recruiterEmail: recruiterByUserId.email || 'No email'
            });
            recruiterId = recruiterByUserId._id;
          } else {
            // Check if user exists but has no recruiter profile
            const User = mongoose.model('User'); // Adjust model name if different
            let userExists = null;
            
            try {
              userExists = await User.findById(recruiterIdToCheck);
            } catch (userFindError) {
              console.log('Error checking user collection:', userFindError.message);
            }
            
            if (userExists) {
              console.log('User exists but no recruiter profile found:', {
                userId: userExists._id,
                userEmail: userExists.email || 'No email',
                userName: userExists.name || 'No name'
              });
              
              return res.status(400).json({
                success: false,
                error: 'Recruiter profile not found',
                details: `User account exists but no recruiter profile is associated. Please complete your recruiter registration first.`,
                requiresRecruiterSetup: true
              });
            } else {
              console.log('No user or recruiter found with ID:', recruiterIdToCheck);
              return res.status(400).json({
                success: false,
                error: 'Invalid user/recruiter ID',
                details: 'No user or recruiter account found with the provided ID'
              });
            }
          }
        }
        
      } catch (recruiterError) {
        console.error('Error validating recruiter:', recruiterError);
        return res.status(400).json({
          success: false,
          error: 'Error validating recruiter ID',
          details: `Database error: ${recruiterError.message}`
        });
      }
    } else {
      console.log('No recruiter ID provided - creating job without recruiter association');
    }

    // Get IP address for location detection
    const ipAddress = getClientIp(req);
    console.log('Client IP detected:', ipAddress);

    // Location detection logic
    let locationData = {};
    
    // Priority 1: Use frontend-provided location data
    if (req.body.latitude && req.body.longitude) {
      try {
        const lat = parseFloat(req.body.latitude);
        const lng = parseFloat(req.body.longitude);
        
        // Validate coordinates are reasonable
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn('Invalid coordinates provided:', { lat, lng });
        } else {
          locationData = {
            latitude: lat,
            longitude: lng,
            country: req.body.country || null,
            countryCode: req.body.countryCode || null,
            region: req.body.region || null,
            city: req.body.city || null,
            timezone: req.body.timezone || null,
            locationSource: 'frontend-provided',
            locationDetectedAt: new Date()
          };
          console.log('Using frontend-provided location:', locationData);
        }
      } catch (coordError) {
        console.warn('Error parsing coordinates:', coordError);
      }
    }
    
    // Priority 2: Auto-detect from IP if no valid coordinates provided
    if (!locationData.latitude && ipAddress && ipAddress !== '127.0.0.1') {
      try {
        console.log('Attempting IP-based location detection...');
        const detectedLocation = await getLocationFromIP(ipAddress);
        if (detectedLocation) {
          locationData = {
            country: detectedLocation.country,
            countryCode: detectedLocation.countryCode,
            region: detectedLocation.region,
            city: detectedLocation.city,
            latitude: detectedLocation.latitude,
            longitude: detectedLocation.longitude,
            timezone: detectedLocation.timezone,
            locationAccuracy: detectedLocation.accuracy,
            locationSource: 'ip-auto',
            locationDetectedAt: new Date(),
            ipAddress: ipAddress
          };
          console.log('Location auto-detected from IP:', locationData);
        } else {
          console.log('IP location detection returned no results');
        }
      } catch (locationError) {
        console.warn('IP location detection failed:', locationError.message);
        // Don't fail job creation due to location detection failure
      }
    }

    // Prepare final job data
    const jobData = {
      // Core job fields
      title: req.body.title.trim(),
      company: req.body.company.trim(),
      description: req.body.description ? req.body.description.trim() : '',
      responsibilities: req.body.responsibilities ? req.body.responsibilities.trim() : '',
      requirements: req.body.requirements ? req.body.requirements.trim() : '',
      jobLocation: req.body.jobLocation ? req.body.jobLocation.trim() : '',
      salary: req.body.salary ? req.body.salary.trim() : '',
      deadline: new Date(req.body.deadline),
      howtoapply: req.body.howtoapply ? req.body.howtoapply.trim() : '',
      
      // Optional fields - Only set recruiter if valid ID found
      recruiter: recruiterId,
      status: req.body.status || 'pending',
      isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true,
      isPinned: req.body.isPinned || false,
      remoteWork: req.body.remoteWork || false,
      jobType: req.body.jobType || '',
      experienceLevel: req.body.experienceLevel || '',
      
      // Location data
      ...locationData,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Analytics
      views: 0,
      applicationCount: 0
    };

    console.log('Final job data prepared for creation:', {
      title: jobData.title,
      company: jobData.company,
      recruiter: jobData.recruiter,
      hasLocation: !!jobData.latitude,
      locationSource: jobData.locationSource
    });

    // Create the job
    console.log('Creating job in database...');
    const job = await Job.create(jobData);
    console.log('Job created successfully with ID:', job._id);
    
    // Populate recruiter data for response (only if recruiter exists)
    let populatedJob;
    try {
      if (recruiterId) {
        populatedJob = await job.populate('recruiter', 'name companyName companyLogo email');
        console.log('Job populated with recruiter data');
      } else {
        populatedJob = job;
        console.log('Job created without recruiter association');
      }
    } catch (populateError) {
      console.warn('Failed to populate recruiter data:', populateError.message);
      populatedJob = job; // Use unpopulated job if populate fails
    }

    // Success response
    const response = {
      success: true,
      data: populatedJob,
      message: 'Job created successfully',
      locationDetected: !!locationData.latitude
    };

    console.log('=== JOB CREATION SUCCESS ===');
    console.log('Response:', {
      ...response,
      data: { ...response.data._doc, description: '[TRUNCATED]' }
    });

    return res.status(201).json(response);

  } catch (error) {
    console.error('=== JOB CREATION ERROR ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate entry',
        details: 'A job with similar details already exists'
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        details: error.message
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Failed to create job',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    // If location fields are being updated, update the source
    let updateData = { ...req.body, updatedAt: new Date() };
    
    if (req.body.latitude || req.body.longitude) {
      updateData.locationSource = 'manual-update';
      updateData.locationDetectedAt = new Date();
    }

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('recruiter', 'name companyName companyLogo');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete job (soft delete)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.body.id,
      {
        isVisible: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Update job status
exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedAt: status === 'approved' ? new Date() : null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Enhanced geo-aware job search
exports.getJobsNearLocation = async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    // Use MongoDB's geospatial query for efficient distance filtering
    const jobs = await Job.aggregate([
      {
        $match: {
          isVisible: { $ne: false },
          $or: [
            {
              latitude: { $exists: true, $ne: null, $ne: 0 },
              longitude: { $exists: true, $ne: null, $ne: 0 }
            }
          ]
        }
      },
      {
        $addFields: {
          distance: {
            $multiply: [
              6371,
              {
                $acos: {
                  $max: [
                    -1,
                    {
                      $min: [
                        1,
                        {
                          $add: [
                            {
                              $multiply: [
                                { $sin: { $multiply: [{ $divide: [userLat, 180] }, Math.PI] } },
                                { $sin: { $multiply: [{ $divide: ['$latitude', 180] }, Math.PI] } }
                              ]
                            },
                            {
                              $multiply: [
                                { $cos: { $multiply: [{ $divide: [userLat, 180] }, Math.PI] } },
                                { $cos: { $multiply: [{ $divide: ['$latitude', 180] }, Math.PI] } },
                                { $cos: { $multiply: [{ $divide: [{ $subtract: ['$longitude', userLng] }, 180] }, Math.PI] } }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              }
            ]
          }
        }
      },
      {
        $match: {
          distance: { $lte: radiusKm }
        }
      },
      {
        $lookup: {
          from: 'recruiters',
          localField: 'recruiter',
          foreignField: '_id',
          as: 'recruiter'
        }
      },
      { $unwind: { path: '$recruiter', preserveNullAndEmptyArrays: true } },
      { $sort: { distance: 1, isPinned: -1, createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
      userLocation: { lat: userLat, lng: userLng, radius: radiusKm }
    });
  } catch (error) {
    console.error('Error fetching geo jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Toggle job pin status
exports.toggleJobPinned = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    job.isPinned = !job.isPinned;
    job.updatedAt = new Date();
    await job.save();

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Bulk location update for existing jobs
exports.updateJobLocations = async (req, res) => {
  try {
    const jobs = await Job.find({
      $or: [
        { latitude: { $exists: false } },
        { latitude: null },
        { latitude: 0 }
      ],
      ipAddress: { $exists: true, $ne: null }
    });

    let updated = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        if (job.ipAddress) {
          const locationData = await getLocationFromIP(job.ipAddress);
          if (locationData) {
            await Job.findByIdAndUpdate(job._id, {
              country: locationData.country,
              countryCode: locationData.countryCode,
              region: locationData.region,
              city: locationData.city,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timezone: locationData.timezone,
              locationAccuracy: locationData.accuracy,
              locationSource: 'ip-auto',
              locationDetectedAt: new Date(),
              updatedAt: new Date()
            });
            updated++;
          } else {
            failed++;
          }
        }
      } catch (error) {
        console.error(`Failed to update location for job ${job._id}:`, error);
        failed++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Location update complete: ${updated} updated, ${failed} failed`,
      stats: { updated, failed, total: jobs.length }
    });
  } catch (error) {
    console.error('Bulk location update error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get job statistics
exports.getJobStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          activeJobs: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$isVisible', true] }, { $gte: ['$deadline', new Date()] }] },
                1,
                0
              ]
            }
          },
          expiredJobs: {
            $sum: {
              $cond: [{ $lt: ['$deadline', new Date()] }, 1, 0]
            }
          },
          totalApplications: { $sum: '$applicationCount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalJobs: 0,
        activeJobs: 0,
        expiredJobs: 0,
        remoteJobs: 0,
        totalApplications: 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Accept job (approve)
exports.acceptJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.body.id,
      {
        status: 'approved',
        isVisible: true,
        approvedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Update recruiter positions
    try {
      await Recruiter.findByIdAndUpdate(
        job.recruiter,
        { 
          $addToSet: { positions: job._id },
          updatedAt: new Date()
        }
      );
    } catch (recruiterError) {
      console.error('Error updating recruiter positions:', recruiterError);
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Reject job
exports.rejectJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.body.id,
      {
        status: 'rejected',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Fetch job status
exports.fetchStatus = async (req, res) => {
  try {
    const item = await Job.findById(req.body.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Apply to job with file attachment
exports.applyJob = async (req, res) => {
  const { userId, jobId, coverLetter } = req.body;
  const fileUrl = req.file?.path;

  if (!fileUrl) {
    return res.status(400).json({
      success: false,
      error: 'Resume file is required.'
    });
  }

  try {
    // Fetch job and increment application count
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    const recruiter = await Recruiter.findOne({ userId: job.recruiter });
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        error: 'Recruiter not found'
      });
    }
    
    const contributor = await Contributor.findOne({ userId });
    if (!contributor) {
      return res.status(404).json({
        success: false,
        error: 'Contributor not found'
      });
    }

    // Download file from Cloudinary
    let response;
    try {
      response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
        timeout: 200000,
        maxRedirects: 5,
      });
    } catch (downloadError) {
      console.error('Error downloading file:', downloadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to download resume file',
        details: downloadError.message
      });
    }

    // Save to temporary file
    const tempFile = tmp.fileSync({ postfix: '.pdf' });
    fs.writeFileSync(tempFile.name, response.data);

    // Email configuration
    const subject = `New Application: ${job.title} - ${contributor.name}`;
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
            .header { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
            .job-details { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .content { margin-top: 20px; }
            .footer { margin-top: 30px; font-size: 14px; color: #777; }
          </style>
        </head>
        <body>
          <div class="header">New Job Application Received</div>
          <div class="job-details">
            <h3>Job: ${job.title}</h3>
            <p><strong>Company:</strong> ${job.company}</p>
            <p><strong>Location:</strong> ${job.jobLocation || 'Not specified'}</p>
            <p><strong>Application ID:</strong> ${jobId}</p>
          </div>
          <div class="content">
            <h4>Applicant Details:</h4>
            <p><strong>Name:</strong> ${contributor.name}</p>
            <p><strong>Email:</strong> ${contributor.email}</p>
            <p><strong>Profile:</strong> <a href="${contributor.profileLink}">${contributor.profileLink}</a></p>
            
            <h4>Cover Letter:</h4>
            <p>${coverLetter || 'No cover letter provided'}</p>
          </div>
          <div class="footer">
            This application was submitted through BeCopy platform.<br>
            Please review the attached resume and contact the candidate directly.
          </div>
        </body>
      </html>`;

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      replyTo: contributor.email,
      to: recruiter.email,
      subject,
      html,
      attachments: [
        {
          filename: `${contributor.name}_Resume.pdf`,
          path: tempFile.name,
          contentType: "application/pdf"
        }
      ]
    });

    // Increment job application count
    await Job.findByIdAndUpdate(jobId, { 
      $inc: { applicationCount: 1 },
      updatedAt: new Date()
    });

    // Clean up temporary file
    try {
      tempFile.removeCallback();
    } catch (cleanupError) {
      console.warn('Failed to clean up temp file:', cleanupError);
    }

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully.',
      data: {
        jobTitle: job.title,
        company: job.company,
        applicationCount: job.applicationCount + 1
      }
    });

  } catch (error) {
    console.error('Error in applyJob:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process application.',
      details: error.message
    });
  }
};

module.exports = {
  getAllJobs: exports.getAllJobs,
  getJob: exports.getJob,
  createJob: exports.createJob,
  updateJob: exports.updateJob,
  deleteJob: exports.deleteJob,
  updateJobStatus: exports.updateJobStatus,
  getJobsNearLocation: exports.getJobsNearLocation,
  toggleJobPinned: exports.toggleJobPinned,
  updateJobLocations: exports.updateJobLocations,
  getJobStats: exports.getJobStats,
  acceptJob: exports.acceptJob,
  rejectJob: exports.rejectJob,
  fetchStatus: exports.fetchStatus,
  applyJob: exports.applyJob
};