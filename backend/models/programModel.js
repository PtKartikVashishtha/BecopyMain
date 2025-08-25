const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  isAnonymous: Boolean,
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  code: {
    java: {
      type: String,
      required: true,
    },
    python: {
      type: String,
      required: true,
    },
    html: {
      type: String,
      required: true,
    }
  },
  copies: {
    type: Number,
    default: 0,
  },
  bugfixes: {
    type: Number,
    default: 0,
  },
  suggestions: {
    type: Number,
    default: 0,
  },
  views: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
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
  status: {
    type: String,
    default: 'pending'
  }
});

module.exports = mongoose.model("Program", programSchema);
