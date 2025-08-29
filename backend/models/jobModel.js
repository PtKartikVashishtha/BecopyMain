const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  company: { type: String, required: true },
  description: { type: String },
  responsibilities: { type: String },
  requirements: { type: String },
  jobLocation: { type: String }, // Original location field
  
  // Enhanced location fields for geo-targeting
  country: { type: String },
  countryCode: { type: String },
  region: { type: String }, // State/Province
  city: { type: String },
  latitude: { type: Number }, // For precise distance calculations
  longitude: { type: Number }, // For precise distance calculations
  locationAccuracy: { type: Number, default: 50 }, // km radius accuracy
  timezone: { type: String },
  
  // IP-based location detection fields
  ipAddress: { type: String }, // Store IP for audit/debugging
  locationSource: { 
    type: String, 
    enum: ['manual', 'ip-auto', 'coordinates', 'text-parsed' , 'frontend-provided'], 
    default: 'manual' 
  },
  locationDetectedAt: { type: Date },
  
  salary: { type: String },
  deadline: { type: Date, required: true },
  howtoapply: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  isVisible: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  approvedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Work type field
  
  // Additional targeting fields
});

// Compound indexes for efficient geo queries
jobSchema.index({ latitude: 1, longitude: 1 });
jobSchema.index({ country: 1, region: 1, city: 1 });
jobSchema.index({ status: 1, isVisible: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ deadline: 1 });

// Text index for search functionality
jobSchema.index({
  title: 'text',
  company: 'text',
  description: 'text',
  jobLocation: 'text'
});

// Pre-save middleware to auto-update timestamps
jobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware to auto-detect location if not provided
jobSchema.pre('save', async function(next) {
  // Skip if location is already set or if this is an update
  if (this.isNew && !this.latitude && !this.longitude && this.locationSource === 'manual') {
    try {
      // You can implement IP-based location detection here
      // For now, we'll mark it for processing
      this.locationSource = 'manual';
    } catch (error) {
      console.error('Auto location detection failed:', error);
    }
  }
  next();
});


module.exports = mongoose.model('Job', jobSchema);