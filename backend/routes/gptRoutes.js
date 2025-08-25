const express = require('express');
const gptController = require('../controllers/gptController');
const router = express.Router();

router.post('/convertcode', gptController.convertCode);

module.exports = router;