const express = require('express');
const router = express.Router();
const recruiterController = require('../controllers/recruiterController');
const { protect, adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', recruiterController.getAllRecruiters);
router.get('/:id', recruiterController.getRecruiter);

// Protected routes
// router.use(protect);
router.post('/', recruiterController.createRecruiter);
router.get('/:id/pinned', recruiterController.toggleRecruiterPinned);

// Admin routes
router.use(adminAuth);
router.put('/:id', recruiterController.updateRecruiter);
router.delete('/:id', recruiterController.deleteRecruiter);


module.exports = router; 