const Video = require('../models/Video');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Comment = require('../models/Comment'); // We'll create this model

// Note: We'll store comments both in a separate collection and embedded in Video.
// A hybrid approach: keep a Comment model for flexibility, and sync count on Video.

// Actually, requirement says "Comments CRUD with count sync on Video"
// We'll use embedded comments within Video document for simple CRUD,
// and still keep an AnalyticsEvent for analytics. So no separate Comment collection needed.

// But to have a proper comment ID for deletion, we can use subdocument _id.
// So all comment operations work directly on the Video array.

// Because they want "Comments CRUD with count sync on Video" – we can simply update the array
// and the count field.

exports.addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    video.comments.push({ user: userId, text });
    video.commentCount = video.comments.length;
    await video.save();

    // Log analytics event
    await AnalyticsEvent.create({ type: 'comment', video: videoId, user: userId });

    // Populate the last comment's user field to return
    const populatedVideo = await Video.findById(videoId).populate('comments.user', 'name avatar');
    const newComment = populatedVideo.comments[populatedVideo.comments.length - 1];
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId)
      .populate('comments.user', 'name avatar')
      .select('comments');
    if (!video) return res.status(404).json({ message: 'Video not found' });

    res.json(video.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Find the video containing the comment
    const video = await Video.findOne({ 'comments._id': commentId });
    if (!video) return res.status(404).json({ message: 'Comment not found' });

    const comment = video.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    
    // Only comment author or video uploader can delete
    if (comment.user.toString() !== userId.toString() && video.uploader.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.remove();
    video.commentCount = video.comments.length;
    await video.save();

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};