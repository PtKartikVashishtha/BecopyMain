const ChatSession = require('../models/chatSessionModel');
const Invite = require('../models/inviteModel');
const User = require('../models/userModel');
const { createTalkJSUser, createTalkJSConversation, generateTalkJSToken } = require('../utils/talkjsService');
const { body, validationResult, param, query } = require('express-validator');


// Validation rules
const createSessionValidation = [
  body('inviteId')
    .notEmpty()
    .withMessage('Invite ID is required')
    .isMongoId()
    .withMessage('Invalid invite ID')
];

const getUserDirectoryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isLength({ max: 100 }).withMessage('Search term too long'),
  query('userType').optional().isIn(['user', 'recruiter']).withMessage('Invalid user type')
];

// Get user directory for chat discovery
const getUserDirectory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const currentUserId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      userType,
      country 
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query to exclude current user and deleted/inactive users
    const query = {
      _id: { $ne: currentUserId },
      isActive: true,
      isDeleted: false,
      isEmailVerified: true
    };

    // Add filters
    if (userType) query.userType = userType;
    if (country) query.country = country;
    
    // Add search functionality
    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('name email userType country createdAt isFeatured isPinned')
      .sort({ 
        isPinned: -1,  // Pinned users first
        isFeatured: -1, // Featured users next
        createdAt: -1   // Then by newest
      })
      .limit(parseInt(limit))
      .skip(skip);

    const totalCount = await User.countDocuments(query);

    // Get invite statuses for these users
    const userIds = users.map(user => user._id);
    const existingInvites = await Invite.find({
      $or: [
        { sender: currentUserId, recipient: { $in: userIds } },
        { sender: { $in: userIds }, recipient: currentUserId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    // Create invite lookup map
    const inviteMap = {};
    existingInvites.forEach(invite => {
      const otherUserId = invite.sender.toString() === currentUserId 
        ? invite.recipient.toString() 
        : invite.sender.toString();
      
      inviteMap[otherUserId] = {
        id: invite._id,
        status: invite.status,
        direction: invite.sender.toString() === currentUserId ? 'sent' : 'received',
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          country: user.country,
          createdAt: user.createdAt,
          isFeatured: user.isFeatured,
          isPinned: user.isPinned,
          inviteStatus: inviteMap[user._id.toString()] || null
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
    console.error('Get user directory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user directory'
    });
  }
};

// Create chat session after invite acceptance
const createChatSession = async (req, res) => {
  try {
    console.log('=== CREATE CHAT SESSION REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user?.id);
    console.log('User object:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { inviteId } = req.body;
    const userId = req.user.id;
    
    console.log('Processing invite ID:', inviteId);
    console.log('Current user ID:', userId);

    // Find accepted invite
    const invite = await Invite.findOne({
      _id: inviteId,
      status: 'accepted',
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    }).populate('sender recipient', 'name email userType');

    if (!invite) {
      return res.status(404).json({
        success: false,
        error: 'Accepted invite not found'
      });
    }

    // Check if chat session already exists
    const existingSession = await ChatSession.findOne({
      inviteId: inviteId
    });

    if (existingSession) {
      return res.status(200).json({
        success: true,
        data: {
          chatSession: {
            id: existingSession._id,
            talkjsConversationId: existingSession.talkjsConversationId,
            participants: [invite.sender, invite.recipient],
            status: existingSession.status,
            createdAt: existingSession.createdAt
          }
        }
      });
    }

    // Create TalkJS users for both participants
    await Promise.all([
      createTalkJSUser(invite.sender),
      createTalkJSUser(invite.recipient)
    ]);

    // Create TalkJS conversation
    const talkjsConversationId = `chat_${invite._id}`;
    await createTalkJSConversation(
      talkjsConversationId,
      [invite.sender, invite.recipient]
    );

    // Create chat session in database
    const chatSession = new ChatSession({
      participants: [invite.sender._id, invite.recipient._id],
      talkjsConversationId,
      inviteId: invite._id,
      metadata: {
        isGroupChat: false
      }
    });

    await chatSession.save();
    await chatSession.populate('participants', 'name email userType');

    res.status(201).json({
      success: true,
      data: {
        chatSession: {
          id: chatSession._id,
          talkjsConversationId: chatSession.talkjsConversationId,
          participants: chatSession.participants,
          status: chatSession.status,
          createdAt: chatSession.createdAt,
          lastActivity: chatSession.lastActivity
        }
      }
    });

  } catch (error) {
    console.error('Create chat session error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user?.id);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat session',
      details: error.message
    });
  }
};

// Get user's chat sessions
const getUserChatSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      status = 'active', 
      page = 1, 
      limit = 20 
    } = req.query;

    const skip = (page - 1) * limit;

    console.log('Fetching chat sessions for user:', userId, 'with status:', status);

    // Check if user has any accepted invites first
    const acceptedInvites = await Invite.find({
      $or: [
        { sender: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });
    console.log('User has', acceptedInvites.length, 'accepted invites');

    const sessions = await ChatSession.findUserChats(userId, {
      status,
      limit: parseInt(limit),
      skip
    });

    console.log('Found sessions:', sessions.length);

    const totalCount = await ChatSession.countDocuments({
      participants: userId,
      status
    });

    console.log('Total count:', totalCount);

    // Format sessions with other participant info
    const formattedSessions = sessions.map(session => {
      const otherParticipant = session.getOtherParticipant(userId);
      
      return {
        id: session._id,
        talkjsConversationId: session.talkjsConversationId,
        otherParticipant: otherParticipant ? {
          id: otherParticipant._id,
          name: otherParticipant.name,
          userType: otherParticipant.userType
        } : null,
        status: session.status,
        lastActivity: session.lastActivity,
        lastMessage: session.lastMessage,
        messageCount: session.messageCount,
        createdAt: session.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: {
        sessions: formattedSessions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user chat sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat sessions'
    });
  }
};

// Generate TalkJS session token for authenticated user
const getTalkJSToken = async (req, res) => {
  try {
    console.log('=== GENERATING TALKJS TOKEN ===');
    console.log('User:', req.user);
    console.log('Environment check:', {
      appId: process.env.TALKJS_APP_ID,
      hasSecretKey: !!process.env.TALKJS_SECRET_KEY
    });

    const user = req.user;

    // Ensure user exists in TalkJS
    await createTalkJSUser(user);

    // Generate session token
    const token = generateTalkJSToken(user.id);
    
    console.log('Token generated successfully');

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.userType
        }
      }
    });

  } catch (error) {
    console.error('Get TalkJS token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate chat token',
      details: error.message
    });
  }
};
// Update chat session activity (called by TalkJS webhook)
const updateChatActivity = async (req, res) => {
  try {
    const { 
      conversationId, 
      messageText, 
      senderId,
      type = 'message' 
    } = req.body;

    if (type !== 'message') {
      return res.status(200).json({ success: true });
    }

    const session = await ChatSession.findOne({
      talkjsConversationId: conversationId
    });

    if (session) {
      await session.updateActivity(messageText, senderId);
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Update chat activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update chat activity'
    });
  }
};

// Archive chat session
const archiveChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await ChatSession.findOne({
      _id: id,
      participants: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    await session.archive();

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status
        }
      }
    });

  } catch (error) {
    console.error('Archive chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to archive chat session'
    });
  }
};

// Block chat session
const blockChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await ChatSession.findOne({
      _id: id,
      participants: userId
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    await session.block();

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session._id,
          status: session.status
        }
      }
    });

  } catch (error) {
    console.error('Block chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to block chat session'
    });
  }
};

// Get specific chat session details
const getChatSession = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await ChatSession.findOne({
      _id: id,
      participants: userId,
      status: { $ne: 'blocked' }
    }).populate('participants inviteId', 'name email userType message');

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found or access denied'
      });
    }

    const otherParticipant = session.getOtherParticipant(userId);

    res.status(200).json({
      success: true,
      data: {
        session: {
          id: session._id,
          talkjsConversationId: session.talkjsConversationId,
          otherParticipant: otherParticipant ? {
            id: otherParticipant._id,
            name: otherParticipant.name,
            userType: otherParticipant.userType
          } : null,
          status: session.status,
          lastActivity: session.lastActivity,
          lastMessage: session.lastMessage,
          messageCount: session.messageCount,
          originalInvite: session.inviteId ? {
            message: session.inviteId.message
          } : null,
          createdAt: session.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat session'
    });
  }
};

// Search users with advanced filtering
const searchUsers = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    const currentUserId = req.user.id;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search term must be at least 2 characters'
      });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      isActive: true,
      isDeleted: false,
      isEmailVerified: true,
      $or: [
        { name: { $regex: searchTerm.trim(), $options: 'i' } },
        { email: { $regex: searchTerm.trim(), $options: 'i' } }
      ]
    })
    .select('name email userType country isFeatured isPinned')
    .limit(10)
    .sort({ isFeatured: -1, isPinned: -1, name: 1 });

    // Get invite statuses for search results
    const userIds = users.map(user => user._id);
    const existingInvites = await Invite.find({
      $or: [
        { sender: currentUserId, recipient: { $in: userIds } },
        { sender: { $in: userIds }, recipient: currentUserId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    const inviteMap = {};
    existingInvites.forEach(invite => {
      const otherUserId = invite.sender.toString() === currentUserId 
        ? invite.recipient.toString() 
        : invite.sender.toString();
      
      inviteMap[otherUserId] = {
        id: invite._id,
        status: invite.status,
        direction: invite.sender.toString() === currentUserId ? 'sent' : 'received'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          country: user.country,
          isFeatured: user.isFeatured,
          isPinned: user.isPinned,
          inviteStatus: inviteMap[user._id.toString()] || null
        }))
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
};

module.exports = {
  getUserDirectory: [getUserDirectoryValidation, getUserDirectory],
  createChatSession: [createSessionValidation, createChatSession],
  getUserChatSessions,
  getTalkJSToken,
  updateChatActivity,
  archiveChatSession: [param('id').isMongoId(), archiveChatSession],
  blockChatSession: [param('id').isMongoId(), blockChatSession],
  getChatSession: [param('id').isMongoId(), getChatSession],
  searchUsers
};