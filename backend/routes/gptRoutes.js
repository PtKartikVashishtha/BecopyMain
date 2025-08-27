const express = require('express');
const gptController = require('../controllers/gptController');
const router = express.Router();

router.post('/convertcode', gptController.convertCode);
router.post('/chat', gptController.chatWithGPT);

module.exports = router;