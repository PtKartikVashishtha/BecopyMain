const express = require('express');
const router = express.Router();
const {
  sendInvite,
  getReceivedInvites,
  getSentInvites,
  acceptInvite,
  declineInvite,
  cancelInvite,
  getInviteStats,
  checkInviteEligibility
} = require('../controllers/inviteController');
const { protect } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);


router.post('/', sendInvite);

router.get('/', getReceivedInvites);


router.get('/sent', getSentInvites);


router.get('/stats', getInviteStats);


router.get('/check/:recipientId', checkInviteEligibility);


router.put('/:id/accept', acceptInvite);


router.put('/:id/decline', declineInvite);


router.delete('/:id', cancelInvite);

module.exports = router;