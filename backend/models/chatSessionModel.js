const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  talkjsConversationId: {
    type: String,
    required: true,
    unique: true
  },
    talkjsSessionToken: {
    type: String,
    default: null
  },
  talkjsLastSync: {
    type: Date,
    default: null
  },
  inviteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invite',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'blocked'],
    default: 'active'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    text: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  },
  messageCount: {
    type: Number,
    default: 0
  },
  metadata: {
    isGroupChat: {
      type: Boolean,
      default: false
    },
    chatTitle: String,
    customData: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Indexes for efficient querying
chatSessionSchema.index({ participants: 1 });
//chatSessionSchema.index({ talkjsConversationId: 1 });
chatSessionSchema.index({ inviteId: 1 });
chatSessionSchema.index({ lastActivity: -1 });
chatSessionSchema.index({ status: 1 });

// Compound index for user's active chats
chatSessionSchema.index({ 
  participants: 1, 
  status: 1, 
  lastActivity: -1 
});

// Pre-save middleware
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Ensure exactly 2 participants for one-on-one chats
 if (this.isNew && !this.metadata.isGroupChat && this.participants.length !== 2) {
  const error = new Error('One-on-one chat must have exactly 2 participants');
  return next(error);
}
  
  next();
});

// Static method to find chat between two users
chatSessionSchema.statics.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    participants: { $all: [userId1, userId2] },
    'metadata.isGroupChat': false,
    status: 'active'
  }).populate('participants', 'name email userType');
};

chatSessionSchema.statics.canUserAccess = function(chatId, userId) {
  return this.findOne({
    _id: chatId,
    participants: userId,
    status: 'active'
  });
};
// Static method to find user's active chats
chatSessionSchema.statics.findUserChats = function(userId, options = {}) {
  const { 
    status = 'active', 
    limit = 20, 
    skip = 0,
    sortBy = '-lastActivity'
  } = options;

  return this.find({
    participants: userId,
    status: status
  })
  .populate('participants', 'name email userType')
  .populate('inviteId', 'message createdAt')
  .sort(sortBy)
  .limit(limit)
  .skip(skip);
};

// Instance method to update last activity
chatSessionSchema.methods.updateActivity = function(messageText, senderId) {
  this.lastActivity = new Date();
  this.messageCount += 1;
  
  if (messageText && senderId) {
    this.lastMessage = {
      text: messageText.substring(0, 100), // Truncate for storage
      senderId: senderId,
      timestamp: new Date()
    };
  }
  
  return this.save();
};

// Instance method to archive chat
chatSessionSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Instance method to block chat
chatSessionSchema.methods.block = function() {
  this.status = 'blocked';
  return this.save();
};

// Instance method to get other participant (for one-on-one chats)
chatSessionSchema.methods.getOtherParticipant = function(currentUserId) {
  if (this.metadata.isGroupChat) {
    return null;
  }
  
  return this.participants.find(participant => 
    participant._id.toString() !== currentUserId.toString()
  );
};

// Virtual for chat display name
chatSessionSchema.virtual('displayName').get(function() {
  if (this.metadata.isGroupChat && this.metadata.chatTitle) {
    return this.metadata.chatTitle;
  }
  
  // For one-on-one chats, return other participant's name
  // This will need to be set when populating
  return 'Chat';
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
module.exports = ChatSession;