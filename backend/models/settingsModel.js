const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  by: {
    type: String,
    default: 'admin'
  },
  isAddCode: Boolean,
  isPostJob: Boolean,
  isApplyJob: Boolean,
  isJobs: Boolean,
  htmlHeading: {
    type: String,
    default: 'Hello Developer'
  },
  pythonHeading: {
    type: String,
    default: 'Hello Developer'
  },
  javaHeading: {
    type: String,
    default: 'Hello Developer'
  },
  htmlCode: String,
  pythonCode: String,
  javaCode: String,
  htmlBackgroundColor: String,
  javaBackgroundColor: String,
  pythonBackgroundColor: String,
  htmlFontSize: String,
  javaFontSize: String,
  pythonFontSize: String,
  htmlFooterBackgroundColor: String,
  pythonFooterBackgroundColor: String,
  javaFooterBackgroundColor: String
  
})

module.exports = mongoose.model("Setting", settingSchema);