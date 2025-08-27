const Job = require('../models/jobModel');
const Contributor = require('../models/contributorModel');
const Recruiter = require('../models/recruiterModel');
const tmp = require('tmp');
const fs = require('fs');
const transporter = require('../utils/sendMailer');
const axios = require('axios');

exports.getAllJobs = async (req, res) => {
  try {
    let isAll = req.query?.all;
    let filterData;

    if (isAll == 'true') {
      filterData = {};
    } else {
      // Only filter by isVisible, don't require status to be 'approved' for testing
      filterData = { isVisible: { $ne: false } }; // This will show jobs unless explicitly set to false
    }
    
    const jobs = await Job.find(filterData)
      .populate('recruiter', 'name companyName companyLogo')
      .sort('-createdAt');
    
    console.log('Jobs found:', jobs.length);
    console.log('Filter used:', filterData);
    
    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
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
      .populate('recruiter');

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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.createJob = async (req, res) => {
  let { company, title, deadline } = req.body;

  if (!company || !title || !deadline) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: company, title, and deadline'
    });
  }

  try {
    // Ensure default values for required fields
    const jobData = {
      ...req.body,
      status: req.body.status || 'pending', // Default status
      isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true, // Default to visible
      isPinned: req.body.isPinned || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const job = await Job.create(jobData);
    
    console.log('Job created successfully:', job._id);

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
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
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

exports.acceptJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.body.id,
      {
        status: 'approved',
        isVisible: true,
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

    // Update recruiter positions (fix the aggregation)
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
      // Don't fail the job acceptance if recruiter update fails
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
    // Fetch job and user details
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

    // Download file from Cloudinary with timeout and retry
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

    // Save to a temporary file
    const tempFile = tmp.fileSync({ postfix: '.pdf' });
    fs.writeFileSync(tempFile.name, response.data);

    // Prepare email content
    const subject = `New Application for Job ID: ${job.title} from ${contributor.name}`;
    console.log('Preparing email with subject:', subject);

    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.6;
            }
            .header {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .content {
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              font-size: 14px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="header">Dear ${recruiter.name},</div>
          <div class="content">
            <p>I hope this message finds you well.</p>
            <p>I recently came across the <strong>${job.title}</strong> position at <strong>${job.company}</strong> and was immediately drawn to the opportunity.</p>
            <p>I have attached my resume for your review.</p>
            <p>${coverLetter}</p>
            <p>I would welcome the chance to further discuss how I can contribute to <strong>${job.company}</strong> and this role.</p>
            <p>Thank you for considering my application. I look forward to the possibility of connecting with you.</p>
          </div>
          <div class="footer">
            Best regards,<br>
            ${contributor.name}<br>
            <a href="mailto:${contributor.email}">${contributor.email}</a> | <a href="${contributor.profileLink}">${contributor.profileLink}</a><br>
            Bcopy
          </div>
        </body>
      </html>`;

    console.log('Email content prepared, attempting to send...');

    // Send email with attachment
    await transporter.sendMail({
      from: contributor.email,
      to: recruiter.email,
      subject,
      html,
      attachments: [
        {
          filename: "resume.pdf",
          path: tempFile.name,
          contentType: "application/pdf"
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Application submitted successfully.'
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