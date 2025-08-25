const express = require('express');
const router = express.Router();

const jobRoutes = require('./jobRoutes');
const contributionRoutes = require('./contributionRoutes');
const recruiterRoutes = require('./recruiterRoutes');
const contributorRoutes = require('./contributorRoutes');
const programRoutes = require('./programRoutes');
const categoryRoutes = require('./categoryRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');
const uploadRoutes = require('./uploadRoutes');
const gptRoutes = require('./gptRoutes');
const dashboardRoutes = require('./dashboardRouter');
const settingRoutes = require('./settingRoutes')
// API routes
router.use('/api/jobs', jobRoutes);
router.use('/api/contributions', contributionRoutes);
router.use('/api/recruiters', recruiterRoutes);
router.use('/api/contributors', contributorRoutes);
router.use('/api/programs', programRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/upload', uploadRoutes);
router.use('/api/gpt', gptRoutes);
router.use('/api/dashboardstring', dashboardRoutes);
router.use('/api/setting',settingRoutes)

module.exports = router; 