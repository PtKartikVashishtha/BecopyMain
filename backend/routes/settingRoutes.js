const express = require('express');
const router = express.Router();
const {updateSettings, getSettings} = require('../controllers/settingController')


router.post('/update', updateSettings);
router.get('/', getSettings);

module.exports = router; 