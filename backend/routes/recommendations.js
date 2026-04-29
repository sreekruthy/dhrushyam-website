const express = require('express');
const router = express.Router();
const { getMostViewed, getSidebarRecommendations } = require('../controllers/recommendationsController');

// Most viewed videos globally, excluding a specific videoId
router.get('/most-viewed', getMostViewed);
// Sidebar for a specific video (exclude current, get related)
router.get('/sidebar/:videoId', getSidebarRecommendations);

module.exports = router;