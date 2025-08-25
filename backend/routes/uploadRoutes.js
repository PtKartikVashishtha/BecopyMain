const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { processExcel } = require('../controllers/excelController');
const { applyJob } = require('../controllers/jobController');

router.post('/code', upload.single('file'), processExcel);
router.post('/apply', upload.single('file'), applyJob);

module.exports = router; 