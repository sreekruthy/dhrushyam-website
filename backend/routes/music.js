const express = require('express');
const router = express.Router();
const { 
  getAllTracks, 
  getTrack, 
  likeTrack, 
  playTrack, 
  uploadTrack 
} = require('../controllers/musicController');
const { protect } = require('../middleware/auth');

router.get('/', getAllTracks);
router.get('/:id', getTrack);
router.post('/:id/like', protect, likeTrack);
router.post('/:id/play', playTrack);          // increment play count
router.post('/upload', protect, uploadTrack); // optional, Member 1 may handle upload

module.exports = router;