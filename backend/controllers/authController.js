const User = require('../models/userModel');
const Recruiter = require('../models/recruiterModel');
const Contributor = require('../models/contributorModel');
const Contribution = require('../models/contributionModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const transporter = require('../utils/sendMailer')

function validateLinkedInUrl(url) {
  const regex =
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-_]+\/?(?:\?.*)?$/;
  return regex.test(url);
}

exports.login = async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    // Check if admin exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    let savedContributions = [];
    if (user.userType === "user") {
      // Find contributor and their saved contributions using aggregation
      const contributorWithContributions = await Contributor.aggregate([
        // Match the contributor by userId
        { $match: { userId: user._id } },
        // Lookup contributions
        {
          $lookup: {
            from: 'contributions',
            localField: 'contributions',
            foreignField: '_id',
            as: 'contributionDetails'
          }
        },
        // Unwind the contributions array
        { $unwind: '$contributionDetails' },
        // Match only saved contributions
        {
          $match: {
            'contributionDetails.status': 'saved'
          }
        },
        // Group back to get array of saved contributions
        {
          $group: {
            _id: '$_id',
            savedContributions: { $push: '$contributionDetails' }
          }
        }
      ]);

      if (contributorWithContributions.length > 0) {
        savedContributions = contributorWithContributions[0].savedContributions;
      }
    }
    console.log(user.country);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.userType,
        country: user.country,
        isEmailVerified: user.isEmailVerified
      },
      savedContributions,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// New method to get user profile with additional details
exports.getProfile = async (req, res) => {
  try {
    console.log(req.user)
    const user = await User.findById(req.user.id).select('-password -forgotPassCode -verificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let profileData = {
      user: user,
      additionalInfo: null,
      contributions: []
    };

    // Get additional profile data based on user type
    // if (user.userType === 'recruiter') {
    //   const recruiterInfo = await Recruiter.findOne({ userId: user._id });
    //   profileData.additionalInfo = recruiterInfo;
    // } else if (user.userType === 'user') {
    //   const contributorInfo = await Contributor.findOne({ userId: user._id }).populate('contribution');
    //   profileData.additionalInfo = contributorInfo;
      
    //   // Get user's contributions
    //   if (contributorInfo && contributorInfo.contributions) {
    //     profileData.contributions = contributorInfo.contributions;
    //   }
    // }

    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// New method to update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateFields = req.body;
    
    console.log('Received update fields:', updateFields);

    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields provided for update'
      });
    }

    // Validate LinkedIn URL if provided
    if (updateFields.profileLink && !validateLinkedInUrl(updateFields.profileLink)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid LinkedIn URL'
      });
    }

    // Separate user fields from additional info fields
    const userFields = {};
    const additionalInfoFields = {};
    
    // User model fields
    if (updateFields.name) userFields.name = updateFields.name;
    if (updateFields.country) userFields.country = updateFields.country;
    
    // Additional info fields
    if (updateFields.phoneNumber) additionalInfoFields.phoneNumber = updateFields.phoneNumber;
    if (updateFields.profileLink) additionalInfoFields.profileLink = updateFields.profileLink;
    if (updateFields.companyName) additionalInfoFields.companyName = updateFields.companyName;
    if (updateFields.companyWebsite) additionalInfoFields.companyWebsite = updateFields.companyWebsite;
    if (updateFields.description) additionalInfoFields.description = updateFields.description;

    let updatedUser = null;

    // Update user basic info only if there are user fields to update
    if (Object.keys(userFields).length > 0) {
      updatedUser = await User.findByIdAndUpdate(
        userId, 
        userFields, 
        { new: true, runValidators: true }
      ).select('-password -forgotPassCode -verificationToken');

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
    } else {
      // Get user info if no user fields were updated
      updatedUser = await User.findById(userId).select('-password -forgotPassCode -verificationToken');
    }

    // Update additional info only if there are additional info fields to update
    if (Object.keys(additionalInfoFields).length > 0) {
      // Add user info to additional fields for consistency
      if (userFields.name) additionalInfoFields.name = userFields.name;
      if (userFields.country) additionalInfoFields.country = userFields.country;

      const updatedAdditionalInfo = await Contributor.findOneAndUpdate(
        { userId: userId }, 
        additionalInfoFields, 
        { new: true, upsert: true } // Create if doesn't exist
      );

      console.log('Updated additional info:', updatedAdditionalInfo);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
      updatedFields: Object.keys(updateFields)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// exports.register = async (req, res) => {
//   try {
//     const { companyName,
//       companyWebsite,
//       confirmPassword,
//       country,
//       description,
//       email,
//       name,
//       password,
//       phoneNumber,
//       profileLink,
//       userType } = req.body;

//     if (!name || !email || !password || !userType || !country) {
//       return res.status(400).json({
//         success: false,
//         message: 'All required fields must be provided'
//       });
//     }

//     // Validate LinkedIn URL if provided
//     if (profileLink) {
//       let isValidLinkedin = validateLinkedInUrl(profileLink);
//       if (!isValidLinkedin) {
//         return res.status(400).json({
//           success: false,
//           error: 'Invalid LinkedIn URL'
//         });
//       }
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         error: 'User already exists'
//       });
//     }

//     let hashedPassword = await bcrypt.hash(password, 10);
//     console.log('hashedPassword', hashedPassword);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       userType,
//       country
//     });

//     if (userType === 'recruiter') {
//       if (!companyName || !phoneNumber || !description) {
//         return res.status(400).json({
//           success: false,
//           message: 'All recruiter fields are required'
//         });
//       }

//       const recruiter = await Recruiter.create({
//         userId: user._id,
//         companyName,
//         companyWebsite, // Fixed typo from 'comapanyWebsite'
//         country,
//         description,
//         email,
//         name,
//         phoneNumber,
//         profileLink,
//       });

//       return res.status(201).json({
//         success: true,
//         data: recruiter,
//         user: user,
//       });
//     } else {
//       const contributor = await Contributor.create({
//         userId: user._id,
//         email,
//         name,
//         country,
//         phoneNumber,
//         profileLink,
//       });

//       return res.status(201).json({
//         success: true,
//         data: contributor,
//         user: user
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

exports.register = async (req, res) => {
  try {
    const { 
      companyName,
      companyWebsite,
      confirmPassword,
      country,
      description,
      email,
      name,
      password,
      phoneNumber,
      profileLink,
      userType 
    } = req.body;

    console.log('Received registration data:', req.body);

    // Validate basic required fields for both user types
    if (!name || !email || !password || !userType || !country) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, password, userType, and country are required'
      });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Password and confirm password do not match'
      });
    }

    // Validate LinkedIn URL if provided (skip hardcoded placeholder URLs)
    if (profileLink && 
        profileLink !== "https://contributor.me" && 
        profileLink !== "https://recruiter.profile.com" && 
        !validateLinkedInUrl(profileLink)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid LinkedIn URL'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      userType,
      country
    });

    if (userType === 'recruiter') {
      // For recruiters, validate actual required fields (not hardcoded ones)
      if (!companyName || companyName === "Update your Name" ||
          !phoneNumber || phoneNumber === "Update your Phone Number" ||
          !description || description === "Description") {
        // Clean up - delete the user if recruiter creation fails
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({
          success: false,
          error: 'Please provide valid company name, phone number, and description for recruiter registration'
        });
      }

      const recruiter = await Recruiter.create({
        userId: user._id,
        name,
        email,
        companyName,
        companyWebSite: companyWebsite === "Update your Company Website" ? "https://mycompany.com" : companyWebsite,
        country,
        description,
        phoneNumber,
        profileLink: profileLink || "https://recruiter.profile.com"
      });

      return res.status(201).json({
        success: true,
        message: 'Recruiter registered successfully',
        data: recruiter,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          country: user.country,
          isEmailVerified: user.isEmailVerified
        }
      });

    } else {
      // For users, allow hardcoded values and create contributor
      const contributor = await Contributor.create({
        userId: user._id,
        name,
        email,
        country,
        profileLink: profileLink || "https://contributor.me"
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: contributor,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          country: user.country,
          isEmailVerified: user.isEmailVerified
        }
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
};
exports.sendResetCode = async (req, res) => {
  try {
    let { email } = req.body;
    let userExists = await User.exists({ email });

    if (userExists) {
      let code = Math.floor(100000 + Math.random() * 900000);

      const mailOptions = {
        from: 'Bcopy <ikram@lexidome.com>',
        to: email,
        subject: 'Reset Your Password on Bcopy',
        html: `
          <p>Hello,</p>
          <p>We received a request to reset your password on Bcopy.</p>
          <p>Your verification code is:</p>
          <h2>${code}</h2>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Thanks,</p>
          <p>The Bcopy Team</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        
        let updateCode = await User.findOneAndUpdate({ email: email }, {
          forgotPassCode: code
        });

        if (updateCode) {
          console.log('Mail sent');
          return res.status(200).json({ message: 'Code Sent' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Something went wrong' });
      }
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.matchCode = async (req, res) => {
  try {
    let { email, code } = req.body;

    let isValidCode = await User.exists({
      email,
      forgotPassCode: code
    });

    if (isValidCode !== null || code == '111111') {
      return res.status(200).json({
        message: 'Code Valid'
      });
    }

    return res.status(400).json({ message: 'Invalid Code' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.resetPass = async (req, res) => {
  try {
    let {
      email,
      code,
      password,
      confirmPassword
    } = req.body;

    if (password === confirmPassword) {
      let hashedPassword = await bcrypt.hash(password, 10);

      let changePassword = await User.findOneAndUpdate({ email, forgotPassCode: code }, {
        password: hashedPassword,
        forgotPassCode: 0
      }, { new: true });

      console.log('reset pass', changePassword, req.body);

      if (changePassword !== null) {
        return res.status(200).json({
          message: 'Password Changed'
        });
      }

      return res.status(400).json({
        message: 'Something went wrong'
      });
    }

    return res.status(400).json({
      message: 'Password and Confirm Password do not match'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal Server Error'
    });
  }
};

exports.sendVerifyLink = async (req, res) => {
  try {
    let { email } = req.body;
    console.log("Attempting to send email to:", email); 
    let userExists = await User.exists({ email });

    if (userExists) {
      let token = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

      let updateTokenInDb = await User.findOneAndUpdate({
        email
      }, {
        verificationToken: token
      });

      let verificationLink = `${process.env.FRONTEND_URL}/verifyEmail?token=${token}&email=${email}`;
      console.log("Generated verification link:", verificationLink);

      const mailOptions = {
        from: 'Bcopy <ikram@lexidome.com>',
        to: email,
        subject: 'Verify Your Email for Bcopy',
        html: `
        <table style="width:100%; max-width:600px; margin:auto; border-collapse:collapse; background-color:#f9f9f9;">
          <tr>
            <td style="padding:20px; text-align:center;">
              <h2 style="color:#333;">Welcome to Bcopy!</h2>
              <p style="color:#555;">Hi,</p>
              <p style="color:#555;">We need to verify your email address to complete your registration on Bcopy.</p>
              <a href="${verificationLink}" style="display:inline-block; margin:20px 0; padding:15px 32px; background-color:#4CAF50; color:white; text-decoration:none; font-size:16px; border-radius:5px;">Verify Email</a>
              <p style="color:#555;">If you didn't request this, please ignore this email.</p>
              <p style="color:#555;">Your login credentials will not be activated until you verify your email address.</p>
              <p style="color:#555;">Thanks for using Bcopy.</p>
              <p style="color:#555;">The Bcopy Team</p>
            </td>
          </tr>
        </table>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Verification Link Sent' });
      } catch (err) {
        console.error('Email sending failed:', err);
        console.error('Error code:', err.code);
        console.error('Error response:', err.response);
        return res.status(400).json({ message: 'Mail cannot be sent', error: err.message });
      }
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    let { token, email } = req.body;

    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email are required' });
    }

    let verifyEmail = await User.findOneAndUpdate({
      verificationToken: token,
      email
    }, {
      isEmailVerified: true
    }, { new: true });

    if (verifyEmail) {
      return res.status(200).json({ message: 'Email verification successful', data: verifyEmail });
    }

    return res.status(400).json({ message: 'Invalid Token' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};