const express = require('express');
const router = express.Router();
const contributionController = require('../controllers/contributionController');
const { protect, adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', contributionController.getAllContributions);
router.get('/:id', contributionController.getContribution);

// Protected routes
// router.use(protect);
router.post('/new', contributionController.createContribution);
router.get('/:id/savedContributions', contributionController.getSavedContributions);
// Admin routes
// router.use(adminAuth);
router.put('/:id', contributionController.updateContribution);
router.patch('/:id/status', contributionController.updateContributionStatus);

router.post('/accept', contributionController.acceptContribution);
router.post('/reject', contributionController.rejectContribution);
router.post('/status', contributionController.fetchStatus);
router.post('/delete', contributionController.deleteContribution);
router.get("/:id/pinned", contributionController.togglePinnedContribution);

module.exports = router; 