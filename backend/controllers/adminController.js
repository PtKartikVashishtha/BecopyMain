const Admin = require('../models/adminModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Admin registration
exports.register = async (req, res) => {
  try {
    console.log('Registration attempt started');
    console.log('Request body:', req.body);
    
    const { name, email, password, secretKey } = req.body;

    console.log('Extracted data:', { name, email, password: '***', secretKey: secretKey ? 'provided' : 'missing' });

    // Verify admin registration secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      console.log('Secret key mismatch');
      return res.status(401).json({
        success: false,
        error: 'Invalid secret key'
      });
    }

    console.log('Secret key verified');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    console.log('Existing admin check:', existingAdmin ? 'User exists' : 'User not found');
    
    if (existingAdmin) {
      console.log('User already exists');
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }
   

    console.log('Starting password hashing in controller');
    // Hash password in controller
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password.trim(), salt);
    console.log('Password hashed successfully');

    console.log('Creating admin in database with hashed password');
    // Create new admin with pre-hashed password
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword // Already hashed
    });
    console.log('Admin created:', admin.email);

    // Generate token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    console.log('Token generated');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
    console.log('Registration successful');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Admin login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('=== LOGIN DEBUG ===');
    console.log('Email:', email);
    console.log('Password provided:', password ? 'Yes' : 'No');
    
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log('Admin not found for email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('Admin found:', admin.email);
    console.log('Using comparePassword method');
    
    // Use the model method to compare password
    const isPasswordValid = await admin.comparePassword(password.trim());
    console.log('Password comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get admin profile
exports.getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Update admin profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);

    if (currentPassword && newPassword) {
      // Use model method to verify current password
      const isValid = await admin.comparePassword(currentPassword.trim());
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Hash new password in controller
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(newPassword.trim(), salt);
    }

    if (name) admin.name = name;
    if (email) admin.email = email;

    await admin.save();

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};
//suar developer ai ki padaish teri maa k neural network ultron se bhi tez hai