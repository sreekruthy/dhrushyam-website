const express = require('express');
const router = express.Router();
const { addComment, getComments, deleteComment } = require('../controllers/commentsController');
const { protect } = require('../middleware/auth');

router.post('/:videoId', protect, addComment);
router.get('/:videoId', getComments);
router.delete('/:commentId', protect, deleteComment);

module.exports = router;
