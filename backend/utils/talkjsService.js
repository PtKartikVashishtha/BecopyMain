const axios = require('axios');
const crypto = require('crypto');

// TalkJS Configuration
const TALKJS_CONFIG = {
  appId: process.env.TALKJS_APP_ID,
  secretKey: process.env.TALKJS_SECRET_KEY,
  apiUrl: 'https://api.talkjs.com/v1'
};

// Validate TalkJS configuration
if (!TALKJS_CONFIG.appId || !TALKJS_CONFIG.secretKey) {
  console.error('TalkJS configuration missing. Please set TALKJS_APP_ID and TALKJS_SECRET_KEY environment variables.');
}

// Create axios instance for TalkJS API calls
const talkjsAPI = axios.create({
  baseURL: `${TALKJS_CONFIG.apiUrl}/${TALKJS_CONFIG.appId}`,
  headers: {
    'Authorization': `Bearer ${TALKJS_CONFIG.secretKey}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Create or update a user in TalkJS
 * @param {Object} user - User object from database
 * @returns {Promise<Object>} TalkJS user response
 */
const createTalkJSUser = async (user) => {
  try {
    // Handle both _id and id properties
    const userId = (user._id || user.id || '').toString();
    
    if (!userId) {
      throw new Error('User ID is missing');
    }
    
    const talkjsUser = {
      id: userId,
      name: user.name || 'Unknown User',
      email: user.email || null,
      role: user.userType || 'user',
      photoUrl: user.profileImage || null,
      custom: {}
    };

    const response = await talkjsAPI.put(`/users/${userId}`, talkjsUser);
    
    console.log(`TalkJS user created/updated: ${userId}`);
    return response.data;

  } catch (error) {
    console.error('Error creating TalkJS user:', error.response?.data || error.message);
    throw new Error('Failed to create TalkJS user');
  }
};

/**
 * Create a conversation in TalkJS
 * @param {string} conversationId - Unique conversation identifier
 * @param {Array} participants - Array of user objects
 * @param {Object} options - Additional conversation options
 * @returns {Promise<Object>} TalkJS conversation response
 */
const createTalkJSConversation = async (conversationId, participants, options = {}) => {
  try {
    console.log('Creating TalkJS conversation with participants:', participants);
    
    // TalkJS expects participants as an array of user IDs
    // Handle both _id and id properties
    const participantIds = participants.map(participant => {
      const id = (participant._id || participant.id || '').toString();
      if (!id) {
        throw new Error('Participant ID is missing');
      }
      return id;
    });
    
    const conversation = {
      participants: participantIds,
      subject: options.subject || `Chat between ${participants.map(p => p.name || 'Unknown').join(' and ')}`,
      custom: {
        inviteId: options.inviteId || null,
        chatType: 'one-on-one'
      }
    };

    console.log('TalkJS conversation payload:', JSON.stringify(conversation, null, 2));
    const response = await talkjsAPI.put(`/conversations/${conversationId}`, conversation);
    
    console.log(`TalkJS conversation created: ${conversationId}`);
    return response.data;

  } catch (error) {
    console.error('Error creating TalkJS conversation:', error.response?.data || error.message);
    throw new Error('Failed to create TalkJS conversation');
  }
};

/**
 * Generate a TalkJS session token for user authentication
 * @param {string} userId - User ID
 * @param {number} expiresIn - Token expiration time in seconds (default: 1 hour)
 * @returns {string} JWT token for TalkJS authentication
 */
const generateTalkJSToken = (userId, expiresIn = 3600) => {
  try {
    // Ensure userId is a string
    const userIdStr = (userId || '').toString();
    
    if (!userIdStr) {
      throw new Error('User ID is required for token generation');
    }
    
    const header = {
      typ: 'JWT',
      alg: 'HS256'
    };

    const payload = {
      appId: TALKJS_CONFIG.appId,
      userId: userIdStr,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn
    };

    // Create JWT token
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', TALKJS_CONFIG.secretKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    const token = `${encodedHeader}.${encodedPayload}.${signature}`;
    
    console.log(`TalkJS token generated for user: ${userIdStr}`);
    return token;

  } catch (error) {
    console.error('Error generating TalkJS token:', error.message);
    throw new Error('Failed to generate TalkJS token');
  }
};

/**
 * Add a user to an existing conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID to add
 * @param {string} access - Access level ('Read' or 'ReadWrite')
 * @returns {Promise<Object>} TalkJS response
 */
const addUserToConversation = async (conversationId, userId, access = 'ReadWrite') => {
  try {
    const userIdStr = (userId || '').toString();
    
    if (!userIdStr) {
      throw new Error('User ID is required');
    }
    
    const participant = {
      access: access,
      notify: true
    };

    const response = await talkjsAPI.put(
      `/conversations/${conversationId}/participants/${userIdStr}`, 
      participant
    );
    
    console.log(`User ${userIdStr} added to conversation ${conversationId}`);
    return response.data;

  } catch (error) {
    console.error('Error adding user to conversation:', error.response?.data || error.message);
    throw new Error('Failed to add user to conversation');
  }
};

/**
 * Remove a user from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} TalkJS response
 */
const removeUserFromConversation = async (conversationId, userId) => {
  try {
    const userIdStr = (userId || '').toString();
    
    if (!userIdStr) {
      throw new Error('User ID is required');
    }
    
    const response = await talkjsAPI.delete(`/conversations/${conversationId}/participants/${userIdStr}`);
    
    console.log(`User ${userIdStr} removed from conversation ${conversationId}`);
    return response.data;

  } catch (error) {
    console.error('Error removing user from conversation:', error.response?.data || error.message);
    throw new Error('Failed to remove user from conversation');
  }
};

/**
 * Send a system message to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} message - Message text
 * @param {Object} options - Message options
 * @returns {Promise<Object>} TalkJS response
 */
const sendSystemMessage = async (conversationId, message, options = {}) => {
  try {
    const messageData = {
      text: message,
      type: 'SystemMessage',
      custom: options.custom || {}
    };

    const response = await talkjsAPI.post(`/conversations/${conversationId}/messages`, [messageData]);
    
    console.log(`System message sent to conversation ${conversationId}`);
    return response.data;

  } catch (error) {
    console.error('Error sending system message:', error.response?.data || error.message);
    throw new Error('Failed to send system message');
  }
};

/**
 * Get conversation details from TalkJS
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Conversation details
 */
const getTalkJSConversation = async (conversationId) => {
  try {
    const response = await talkjsAPI.get(`/conversations/${conversationId}`);
    return response.data;

  } catch (error) {
    console.error('Error fetching TalkJS conversation:', error.response?.data || error.message);
    throw new Error('Failed to fetch conversation details');
  }
};

/**
 * Update conversation settings
 * @param {string} conversationId - Conversation ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} TalkJS response
 */
const updateTalkJSConversation = async (conversationId, updates) => {
  try {
    const response = await talkjsAPI.patch(`/conversations/${conversationId}`, updates);
    
    console.log(`Conversation ${conversationId} updated`);
    return response.data;

  } catch (error) {
    console.error('Error updating TalkJS conversation:', error.response?.data || error.message);
    throw new Error('Failed to update conversation');
  }
};

/**
 * Delete a conversation (archives it in TalkJS)
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} TalkJS response
 */
const deleteTalkJSConversation = async (conversationId) => {
  try {
    const response = await talkjsAPI.delete(`/conversations/${conversationId}`);
    
    console.log(`Conversation ${conversationId} deleted`);
    return response.data;

  } catch (error) {
    console.error('Error deleting TalkJS conversation:', error.response?.data || error.message);
    throw new Error('Failed to delete conversation');
  }
};

/**
 * Verify TalkJS webhook signature
 * @param {string} payload - Webhook payload
 * @param {string} signature - Webhook signature header
 * @returns {boolean} True if signature is valid
 */
const verifyWebhookSignature = (payload, signature) => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', TALKJS_CONFIG.secretKey)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;

  } catch (error) {
    console.error('Error verifying webhook signature:', error.message);
    return false;
  }
};

/**
 * Sync user data with TalkJS (useful for bulk updates)
 * @param {Array} users - Array of user objects
 * @returns {Promise<Array>} Results of sync operations
 */
const syncUsersWithTalkJS = async (users) => {
  try {
    const results = await Promise.allSettled(
      users.map(user => createTalkJSUser(user))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`TalkJS sync completed: ${successful} successful, ${failed} failed`);
    return results;

  } catch (error) {
    console.error('Error syncing users with TalkJS:', error.message);
    throw new Error('Failed to sync users with TalkJS');
  }
};

module.exports = {
  createTalkJSUser,
  createTalkJSConversation,
  generateTalkJSToken,
  addUserToConversation,
  removeUserFromConversation,
  sendSystemMessage,
  getTalkJSConversation,
  updateTalkJSConversation,
  deleteTalkJSConversation,
  verifyWebhookSignature,
  syncUsersWithTalkJS
};