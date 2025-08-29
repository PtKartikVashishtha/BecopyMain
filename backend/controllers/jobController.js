const Job = require('../models/jobModel');
const Contributor = require('../models/contributorModel');
const Recruiter = require('../models/recruiterModel');
const tmp = require('tmp');
const fs = require('fs');
const transporter = require('../utils/sendMailer');
const axios = require('axios');

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
    // Primary API - ipapi.co
    const response = await axios.get(`https://ipwho.is/${ipAddress}/json/`, {
      timeout: 5000
    });

    if (response.data && response.data.country_name && response.data.latitude) {
      return {
        country: response.data.country_name,
        countryCode: response.data.country_code,
        region: response.data.region,
        city: response.data.city,
        latitude: parseFloat(response.data.latitude),
        longitude: parseFloat(response.data.longitude),
        timezone: response.data.timezone,
        accuracy: 20,
        source: 'ipapi.co'
      };
    }

    // Fallback API - ipwho.is
    const fallbackResponse = await axios.get(`https://ipwho.is/${ipAddress}`, {
      timeout: 5000
    });

    if (fallbackResponse.data && fallbackResponse.data.success !== false) {
      const data = fallbackResponse.data;
      return {
        country: data.country,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone?.id,
        accuracy: 50,
        source: 'ipwho.is'
      };
    }

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
    const { lat, lng, radius = 250, geoMode } = req.query;
    
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
              {
                $and: [
                  { latitude: { $in: [null, 0] } },
                  { longitude: { $in: [null, 0] } },
                  // Text-based location matching for jobs without coordinates
                  {
                    $or: [
                      { country: { $regex: new RegExp(req.query.userCountry || '', 'i') } },
                      { jobLocation: { $regex: new RegExp(req.query.userCity || '', 'i') } }
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
      pipeline.push({ $sort: { distance: 1, createdAt: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    const jobs = await Job.aggregate(pipeline);
    
    console.log(`Jobs found: ${jobs.length}${geoMode === 'true' ? ` within ${radius}km` : ' globally'}`);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
      geoFiltered: geoMode === 'true'
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
    
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

exports.createJob = async (req, res) => {
  const { company, title, deadline } = req.body;

  if (!company || !title || !deadline) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: company, title, and deadline'
    });
  }

  try {
    // Get IP address from request
    const ipAddress = getClientIp(req)

    // Auto-detect location from IP if not provided
    let locationData = {};
    if (!req.body.latitude && !req.body.longitude && ipAddress && ipAddress !== '127.0.0.1') {
      try {
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
          console.log('Location auto-detected:', detectedLocation);
        }
      } catch (locationError) {
        console.warn('IP location detection failed:', locationError.message);
      }
    } else if (req.body.latitude && req.body.longitude) {
      locationData = {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
        locationSource: 'coordinates'
      };
    }

    // Merge job data with location data
    const jobData = {
      ...req.body,
      ...locationData,
      status: req.body.status || 'pending',
      isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true,
      isPinned: req.body.isPinned || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const job = await Job.create(jobData);
    
    // Populate recruiter data for response
    await job.populate('recruiter', 'name companyName companyLogo');
    
    console.log('Job created successfully with location:', job._id);

    return res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

exports.updateJob = async (req, res) => {
  try {
    // If location fields are being updated, update the source
    let updateData = { ...req.body, updatedAt: new Date() };
    
    if (req.body.latitude || req.body.longitude) {
      updateData.locationSource = 'coordinates';
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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

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
            $cond: {
              then: 0, // Remote jobs have 0 distance
              else: {
                // Haversine formula for distance calculation
                $multiply: [
                  6371,
                  {
                    $acos: {
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
                  }
                ]
              }
            }
          }
        }
      },
      {
        $match: {
          $or: [
            { distance: { $lte: radiusKm } }
          ]
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
          if (locationData) {a
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
    const job = await Job.findById(
      jobId
    );
    
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

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully.',
      data: {
        jobTitle: job.title,
        company: job.company,
        applicationCount: job.applicationCount
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

// New endpoint: Get job statistics
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
      error: error 
    })
  }
}