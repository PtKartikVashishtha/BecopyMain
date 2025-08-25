const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter'
  },
  company: {
    type: String,
    require: true,
  },
  description: {
    type: String,
  },
  responsibilities: {
    type: String,
  },
  requirements: {
    type: String,
  },
  jobLocation: {
    type: String,
  },
  salary: {
    type: String,
  },
  deadline: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  howtoapply: { type: String, },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isVisible: {
    type: Boolean,
    default: false
  },
    isFeatured:{
    type: Boolean,
    default: false,
  },
  isPinned:{
    type: Boolean,
    default: false,
  },
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema); 