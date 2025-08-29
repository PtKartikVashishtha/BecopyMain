const Invite = require('../models/inviteModel');
const User = require('../models/userModel');
const { getIO } = require('../utils/socket');
const { body, validationResult, param } = require('express-validator');

// Validation rules
const sendInviteValidation = [
  body('recipientId')
    .notEmpty()
    .withMessage('Recipient ID is required')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
  body('message')
    .notEmpty()
    .withMessage('Invite message is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Message must be between 5 and 500 characters')
    .trim()
];

const inviteActionValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid invite ID')
];

// Send chat invite
const sendInvite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { recipientId, message } = req.body;
    const senderId = req.user.id;

    // Check if recipient exists and is active
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive || recipient.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'Recipient not found or inactive'
      });
    }

    // Prevent self-invite
    if (senderId === recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send invite to yourself'
      });
    }

    // Check for existing pending invite between users
    const existingInvite = await Invite.findActiveBetweenUsers(senderId, recipientId);
    if (existingInvite) {
      return res.status(400).json({
        success: false,
        error: 'There is already a pending invite between you and this user'
      });
    }

    // Create new invite
    const invite = new Invite({
      sender: senderId,
      recipient: recipientId,
      message: message.trim()
    });

    await invite.save();

    // Populate sender details for response
    await invite.populate('sender', 'name email userType');

    // Send real-time notification to recipient
    const io = getIO();
    io.to(`user_${recipientId}`).emit('chat-invite-received', {
      inviteId: invite._id,
      sender: {
        id: req.user.id,
        name: req.user.name,
        userType: req.user.userType
      },
      message: invite.message,
      createdAt: invite.createdAt
    });

    res.status(201).json({
      success: true,
      data: {
        invite: {
          id: invite._id,
          recipient: {
            id: recipient._id,
            name: recipient.name,
            userType: recipient.userType
          },
          message: invite.message,
          status: invite.status,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt
        }
      }
    });

  } catch (error) {
    console.error('Send invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invite'
    });
  }
};

// Get received invites for current user
const getReceivedInvites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    // Clean up expired invites first
    await Invite.cleanupExpired();

    const skip = (page - 1) * limit;
    
    const invites = await Invite.find({
      recipient: userId,
      status: status,
      ...(status === 'pending' && { expiresAt: { $gte: new Date() } })
    })
    .populate('sender', 'name email userType country')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

    const totalCount = await Invite.countDocuments({
      recipient: userId,
      status: status,
      ...(status === 'pending' && { expiresAt: { $gte: new Date() } })
    });

    res.status(200).json({
      success: true,
      data: {
        invites: invites.map(invite => ({
          id: invite._id,
          sender: {
            id: invite.sender._id,
            name: invite.sender.name,
            email: invite.sender.email,
            userType: invite.sender.userType,
            country: invite.sender.country
          },
          message: invite.message,
          status: invite.status,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          isExpired: invite.isExpired
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get received invites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invites'
    });
  }
};

// Get sent invites for current user
const getSentInvites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    // Clean up expired invites first
    await Invite.cleanupExpired();

    const skip = (page - 1) * limit;
    
    const query = { sender: userId };
    if (status) query.status = status;

    const invites = await Invite.find(query)
    .populate('recipient', 'name email userType country')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

    const totalCount = await Invite.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        invites: invites.map(invite => ({
          id: invite._id,
          recipient: {
            id: invite.recipient._id,
            name: invite.recipient.name,
            email: invite.recipient.email,
            userType: invite.recipient.userType,
            country: invite.recipient.country
          },
          message: invite.message,
          status: invite.status,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          isExpired: invite.isExpired
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get sent invites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sent invites'
    });
  }
};

// Accept invite
const acceptInvite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const invite = await Invite.findOne({
      _id: id,
      recipient: userId,
      status: 'pending'
    }).populate('sender', 'name email userType');

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite not found or already processed'
      });
    }

    // Check if invite is expired
    if (invite.isExpired) {
      await invite.cancel();
      return res.status(400).json({
        success: false,
        error: 'This invite has expired'
      });
    }

    // Accept the invite
    await invite.accept();

    // Send notification to sender
    const io = getIO();
    io.to(`user_${invite.sender._id}`).emit('chat-invite-accepted', {
      inviteId: invite._id,
      acceptedBy: {
        id: req.user.id,
        name: req.user.name,
        userType: req.user.userType
      },
      acceptedAt: invite.acceptedAt
    });

    res.status(200).json({
      success: true,
      data: {
        invite: {
          id: invite._id,
          sender: {
            id: invite.sender._id,
            name: invite.sender.name,
            userType: invite.sender.userType
          },
          status: invite.status,
          acceptedAt: invite.acceptedAt
        }
      }
    });

  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept invite'
    });
  }
};

// Decline invite
const declineInvite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const invite = await Invite.findOne({
      _id: id,
      recipient: userId,
      status: 'pending'
    }).populate('sender', 'name email userType');

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite not found or already processed'
      });
    }

    // Decline the invite
    await invite.decline();

    // Send notification to sender
    const io = getIO();
    io.to(`user_${invite.sender._id}`).emit('chat-invite-declined', {
      inviteId: invite._id,
      declinedBy: {
        id: req.user.id,
        name: req.user.name,
        userType: req.user.userType
      },
      declinedAt: invite.declinedAt
    });

    res.status(200).json({
      success: true,
      data: {
        invite: {
          id: invite._id,
          status: invite.status,
          declinedAt: invite.declinedAt
        }
      }
    });

  } catch (error) {
    console.error('Decline invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline invite'
    });
  }
};

// Cancel sent invite
const cancelInvite = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const invite = await Invite.findOne({
      _id: id,
      sender: userId,
      status: 'pending'
    }).populate('recipient', 'name email userType');

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Invite not found or cannot be cancelled'
      });
    }

    // Cancel the invite
    await invite.cancel();

    // Send notification to recipient
    const io = getIO();
    io.to(`user_${invite.recipient._id}`).emit('chat-invite-cancelled', {
      inviteId: invite._id,
      cancelledBy: {
        id: req.user.id,
        name: req.user.name,
        userType: req.user.userType
      },
      cancelledAt: invite.cancelledAt
    });

    res.status(200).json({
      success: true,
      data: {
        invite: {
          id: invite._id,
          status: invite.status,
          cancelledAt: invite.cancelledAt
        }
      }
    });

  } catch (error) {
    console.error('Cancel invite error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel invite'
    });
  }
};

// Get invite statistics for user
const getInviteStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Clean up expired invites first
    await Invite.cleanupExpired();

    const stats = await Promise.all([
      Invite.countDocuments({ recipient: userId, status: 'pending', expiresAt: { $gte: new Date() } }),
      Invite.countDocuments({ sender: userId, status: 'pending', expiresAt: { $gte: new Date() } }),
      Invite.countDocuments({ recipient: userId, status: 'accepted' }),
      Invite.countDocuments({ sender: userId, status: 'accepted' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          pendingReceived: stats[0],
          pendingSent: stats[1],
          acceptedReceived: stats[2],
          acceptedSent: stats[3],
          totalPending: stats[0] + stats[1],
          totalAccepted: stats[2] + stats[3]
        }
      }
    });

  } catch (error) {
    console.error('Get invite stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invite statistics'
    });
  }
};

// Check if user can send invite to specific recipient
const checkInviteEligibility = async (req, res) => {
  try {
    const { recipientId } = req.params;
    const senderId = req.user.id;

    if (!recipientId || senderId === recipientId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recipient'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive || recipient.isDeleted) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check for existing invite
    const existingInvite = await Invite.findActiveBetweenUsers(senderId, recipientId);
    
    const canSendInvite = !existingInvite;
    let reason = null;

    if (existingInvite) {
      const isUserSender = existingInvite.sender.toString() === senderId;
      reason = isUserSender 
        ? 'You have already sent an invite to this user'
        : 'This user has already sent you an invite';
    }

    res.status(200).json({
      success: true,
      data: {
        canSendInvite,
        reason,
        existingInvite: existingInvite ? {
          id: existingInvite._id,
          status: existingInvite.status,
          direction: existingInvite.sender.toString() === senderId ? 'sent' : 'received'
        } : null
      }
    });

  } catch (error) {
    console.error('Check invite eligibility error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check invite eligibility'
    });
  }
};

module.exports = {
  sendInvite: [sendInviteValidation, sendInvite],
  getReceivedInvites,
  getSentInvites,
  acceptInvite: [inviteActionValidation, acceptInvite],
  declineInvite: [inviteActionValidation, declineInvite],
  cancelInvite: [inviteActionValidation, cancelInvite],
  getInviteStats,
  checkInviteEligibility
};