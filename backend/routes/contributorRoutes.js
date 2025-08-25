const express = require('express');
const router = express.Router();
const contributorController = require('../controllers/contributorController');
const { adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', contributorController.getAllContributors);
router.get('/:id', contributorController.getContributor);

// Protected routes
// router.use(adminAuth);
router.post('/', contributorController.createContributor);
router.put('/:id', contributorController.updateContributor);
router.delete('/:id', contributorController.deleteContributor);
router.get("/:id/pinned", contributorController.togglePinned);

module.exports = router; 