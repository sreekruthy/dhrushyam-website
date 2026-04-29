const express = require('express');
const router = express.Router();
const { logEvent, getVideoAnalytics, getCreatorDashboard } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.post('/event', logEvent);                     // log a view/like/etc.
router.get('/video/:videoId', getVideoAnalytics);    // aggregated stats for a video
router.get('/creator', protect, getCreatorDashboard); // creator's own dashboard

module.exports = router;