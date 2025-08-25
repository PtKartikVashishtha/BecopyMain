const mongoose = require('mongoose');

const dashboardStringSchema = new mongoose.Schema({
  dashString: {
    type: String,
    required: true,
  },
  fontSize: {
    type: Number,
    require: true,
    default: 10,
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dashboard', dashboardStringSchema); 