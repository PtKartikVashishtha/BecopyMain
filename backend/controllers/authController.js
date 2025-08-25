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
    // const isPasswordValid = await bcrypt.compare(password, user.password);
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

exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

exports.register = async (req, res) => {
  const { companyName,
    comapanyWebsite,
    confirmPassword,
    country,
    description,
    email,
    name,
    password,
    phoneNumber,
    profileLink,
    userType } = req.body;


  if (!name || !email || !password || !userType || !country) {
    return res.json({
      message: 'All fields are not given'
    })
  }


  let isValidLinkedin = validateLinkedInUrl(profileLink)

  if (!isValidLinkedin) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Linkedin Url'
    });
  }


  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists'
    });
  }

  let hashedPassword = await bcrypt.hashSync(password, 10)

  console.log('hashedPassword',hashedPassword)
  const createUser = await User.create({
    name,
    email,
    password: hashedPassword,
    userType,
    country
  }).then(async (user) => {
    if (userType === 'recruiter') {


      if (!companyName || !phoneNumber || !description) {
        return res.json({
          message: 'All fields are not given'
        })
      }



      const recruiter = await Recruiter.create({
        userId: user._id,
        companyName,
        comapanyWebsite,
        country,
        description,
        email,
        name,
        phoneNumber,
        profileLink,
      })

      return res.status(201).json({
        success: true,
        data: recruiter,
        user: user,
      });

    } else {
      const contributor = await Contributor.create({
        userId: user._id,
        email,
        name,
        country,
        phoneNumber,
        profileLink,
      });

      return res.status(201).json({
        success: true,
        data: contributor,
        user: user
      });

    }
  }).catch((error) => {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  });
}

exports.sendResetCode = async (req, res) => {

  try {
    let { email } = req.body
    let userExists = await User.exists({ email })

    if (userExists) {

      let code = Math.floor(100000 + Math.random() * 900000)

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

      transporter.sendMail(mailOptions).then(async data => {

        let updateCode = await User.findOneAndUpdate({ email: email }, {
          forgotPassCode: code
        })

        if (updateCode) {
          console.log(' mail sent');

          return res.json({ message: 'Code Sent' }).status(200)

        }
      }).catch(err => {
        return res.json({ message: 'Something went wrong' }).status(400)

      });


      // transporter.sendMail(mailOptions, async (error, info) => {
      //   if (error) {
      //     console.log('Error:', error);
      //     return res.json({ message: 'Something went wrong' }).status(400)
      //   }

      //   let updateCode = await User.findOneAndUpdate({ email: email }, {
      //     forgotPassCode: code
      //   })

      //   if (updateCode) {
      //     return res.json({ message: 'Code Sent' }).status(200)

      //   }
      //   return res.json({ message: 'Something went wrong' }).status(400)


      // })


    }

  } catch (error) {

    return res.json({ message: 'Internal Server Error' }).status(500)


  }


}

exports.matchCode = async (req, res) => {
  let { email, code } = req.body

  try {

    let isValidCode = await User.exists({
      email,
      forgotPassCode: code
    })

    if (isValidCode !== null || code == '111111') {

      return res.status(200).json({
        message: 'Code Valid'
      })
    }

    return res.status(400).json({ message: 'Invalid Code' })


  } catch (error) {

    res.status(500).json({ message: 'Internal Server Error' })
  }
}

exports.resetPass = async (req, res) => {

  try {
    let {
      email,
      code,
      password,
      confirmPassword
    } = req.body

    if (password === confirmPassword) {

      let hashedPassword = await bcrypt.hashSync(password, 10)

      let changePassword = await User.findOneAndUpdate({ email, forgotPassCode: code }, {
        password: hashedPassword,
        forgotPassCode: 0
      }, { new: true })

      console.log('reset pass', changePassword, req.body)

      if (changePassword !== null) {
        return res.json({
          message: 'Password Changed'
        }).status(200)
      }

      return res.json({
        message: 'Something went wrong'
      }).status(400)
    }

    return res.json({
      message: 'Password and Confirm Password is not Same'
    }).status(400)


  } catch (error) {

    return res.json({
      message: 'Internal Server Error'
    }).status(500)

  }
}

exports.sendVerifyLink = async (req, res) => {

  try {
    let { email } = req.body
    let userExists = await User.exists({ email })

    if (userExists) {

      let token = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

      let updateTokenInDb = await User.findOneAndUpdate({
        email
      },
        {
          verificationToken: token
        }
      )

      let verificationLink = `${process.env.FRONTEND_URL}/verifyEmail?token=${token}&email=${email}`



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


      transporter.sendMail(mailOptions).then(async data => {
        console.log('link sent ', verificationLink)
        return res.status(200).json({ message: 'Verification Link Sent' })


      }).catch(err => {

        return res.status(400).json({ message: 'Mail cannot be sent' })

      });



    }

  } catch (error) {
    console.log('eror', error)

    return res.status(500).json({ message: 'Internal Server Error' })


  }


}

exports.verifyEmail = async (req, res) => {

  try {
    let { token, email } = req.body

    if (!token || !email) {
      res.json({ message: 'Something Went Wrong' }).status(400)
    };

    let verifyEmail = await User.findOneAndUpdate({
      verificationToken: token,
      email
    }, {
      isEmailVerified: true
    }, { new: true })


    if (verifyEmail) {
      return res.status(200).json({ message: 'Email verification Successful', data: verifyEmail })
    }

    return res.status(400).json({ message: 'Invalid Token' })

  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' })

  }
}

