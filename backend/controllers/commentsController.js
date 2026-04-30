const Video = require('../models/Video');
const Comment = require('../models/Comment');
const AnalyticsEvent = require('../models/AnalyticsEvent');

exports.addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    const comment = await Comment.create({ video: videoId, user: userId, text });

    // Sync count on Video
    await Video.findByIdAndUpdate(videoId, { $inc: { commentCount: 1 } });

    await AnalyticsEvent.create({ type: 'comment', video: videoId, user: userId });

    const populated = await comment.populate('user', 'username avatar');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const comments = await Comment.find({ video: videoId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await comment.deleteOne();
    await Video.findByIdAndUpdate(comment.video, { $inc: { commentCount: -1 } });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};