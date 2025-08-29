const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  acceptedAt: {
    type: Date,
    default: null
  },
  declinedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
   talkjsConversationId: {
    type: String,
    default: null,
    // This will store the TalkJS conversation ID once chat is initiated
  },
  chatInitiatedAt: {
    type: Date,
    default: null,
    // Track when the actual chat conversation was created
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
inviteSchema.index({ sender: 1, recipient: 1 });
inviteSchema.index({ recipient: 1, status: 1 });
inviteSchema.index({ sender: 1, status: 1 });
inviteSchema.index({ expiresAt: 1 });

// Prevent duplicate pending invites between same users
inviteSchema.index(
  { sender: 1, recipient: 1, status: 1 },
  { 
    unique: true, 
    partialFilterExpression: { status: 'pending' } 
  }
);

// Pre-save middleware to update timestamps
inviteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for checking if invite is expired
inviteSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && new Date() > this.expiresAt;
});

// Static method to find active invites between users
inviteSchema.statics.findActiveBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { sender: userId1, recipient: userId2, status: 'pending' },
      { sender: userId2, recipient: userId1, status: 'pending' }
    ]
  });
};
inviteSchema.statics.findAcceptedBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { sender: userId1, recipient: userId2, status: 'accepted' },
      { sender: userId2, recipient: userId1, status: 'accepted' }
    ]
  }).populate('sender recipient', 'name email');
};

// Static method to clean up expired invites
inviteSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      status: 'pending', 
      expiresAt: { $lt: new Date() } 
    },
    { 
      status: 'cancelled',
      cancelledAt: new Date()
    }
  );
};

// Instance method to accept invite
inviteSchema.methods.accept = function() {
  this.status = 'accepted';
  this.acceptedAt = new Date();
  return this.save();
};
// Instance method to initialize chat after acceptance
inviteSchema.methods.initializeChat = function(conversationId) {
  this.talkjsConversationId = conversationId;
  this.chatInitiatedAt = new Date();
  return this.save();
};

// Instance method to decline invite
inviteSchema.methods.decline = function() {
  this.status = 'declined';
  this.declinedAt = new Date();
  return this.save();
};

// Instance method to cancel invite
inviteSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  return this.save();
};

const Invite = mongoose.model('Invite', inviteSchema);
module.exports = Invite;