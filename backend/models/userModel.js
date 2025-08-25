const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  userType: {
    type: String,
    required: true,
    enum: ["user", "recruiter"],
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  forgotPassCode: Number,
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
})

// // Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

// // Compare password method
// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };


module.exports = mongoose.model("User", userSchema);