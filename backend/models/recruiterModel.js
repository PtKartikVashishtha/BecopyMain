const mongoose = require("mongoose");

const recruiterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    default: "recruiter@example.com"
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  profileLink: {
    type: String,
    required: true,
    default: "https://recruiter.profile.com"
  },
  companyName: {
    type: String,
    required: true,
  },
  companyWebSite: {
    type: String,
    required: true,
    default: "https://mycompany.com"
  },
  companyLogo: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: true,
    default: "I am a recruiter of company!"
  },
  positions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
    },
  ],
  country: {
    type: String,
    required: true,
  },
    isFeatured:{
    type: Boolean,
    default: false,
  },
  isPinned:{
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Recruiter", recruiterSchema);