const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Route to get all dashboard strings 
router.get('/', dashboardController.getAll);
// Route to create a new dashboard string
router.post('/', dashboardController.update);

module.exports = router; 