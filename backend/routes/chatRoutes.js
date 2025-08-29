const express = require('express');
const router = express.Router();
const {
  getUserDirectory,
  createChatSession,
  getUserChatSessions,
  getTalkJSToken,
  updateChatActivity,
  archiveChatSession,
  blockChatSession,
  getChatSession,
  searchUsers
} = require('../controllers/chatController');
//const auth = require('../middleware/auth');

// Apply authentication middleware to all routes except webhook
// router.use((req, res, next) => {
//   // Skip auth for TalkJS webhook
//   if (req.path === '/webhook') {
//     return next();
//   }
//   return auth(req, res, next);
// });

// @route   GET /api/chat/users
// @desc    Get user directory for chat discovery
// @access  Private
router.get('/users', getUserDirectory);

// @route   GET /api/chat/users/search
// @desc    Search users with advanced filtering
// @access  Private
router.get('/users/search', searchUsers);

// @route   POST /api/chat/session
// @desc    Create chat session after invite acceptance
// @access  Private
router.post('/session', createChatSession);

// @route   GET /api/chat/sessions
// @desc    Get user's chat sessions
// @access  Private
router.get('/sessions', getUserChatSessions);

// @route   GET /api/chat/sessions/:id
// @desc    Get specific chat session details
// @access  Private
router.get('/sessions/:id', getChatSession);

// @route   PUT /api/chat/sessions/:id/archive
// @desc    Archive chat session
// @access  Private
router.put('/sessions/:id/archive', archiveChatSession);

// @route   PUT /api/chat/sessions/:id/block
// @desc    Block chat session
// @access  Private
router.put('/sessions/:id/block', blockChatSession);

// @route   GET /api/chat/token
// @desc    Generate TalkJS session token for authenticated user
// @access  Private
router.get('/token', getTalkJSToken);

// @route   POST /api/chat/webhook
// @desc    Handle TalkJS webhook events
// @access  Public (webhook)
router.post('/webhook', updateChatActivity);

module.exports = router;