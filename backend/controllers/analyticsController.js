const mongoose = require('mongoose');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const Video = require('../models/Video');

// Log a single event (called from frontend on view, like, etc.)
exports.logEvent = async (req, res) => {
  try {
    const { type, videoId, userId } = req.body; // userId optional
    if (!type || !videoId) return res.status(400).json({ message: 'Type and videoId required' });

    const event = await AnalyticsEvent.create({
      type,
      video: videoId,
      user: userId || null,
    });

    // Real-time view count update could be handled via Socket.IO elsewhere,
    // but we also increment Video.views for views only
    if (type === 'view') {
      await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });
    }

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Aggregated analytics for a specific video (views, likes, dislikes over time)
exports.getVideoAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { period = 'day' } = req.query; // day, month, year

    // Build date grouping
    let groupFormat;
    if (period === 'month') {
      groupFormat = { $dateToString: { format: '%Y-%m', date: '$timestamp' } };
    } else if (period === 'year') {
      groupFormat = { $dateToString: { format: '%Y', date: '$timestamp' } };
    } else {
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }; // day
    }

    const pipeline = [
      { $match: { video: mongoose.Types.ObjectId(videoId) } },
      { 
        $group: {
          _id: { date: groupFormat, type: '$type' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ];

    const results = await AnalyticsEvent.aggregate(pipeline);

    // Transform into a more usable format: { date: { views: X, likes: Y, ... } }
    const formatted = {};
    results.forEach(item => {
      const date = item._id.date;
      if (!formatted[date]) formatted[date] = { views: 0, likes: 0, dislikes: 0, comments: 0 };
      formatted[date][item._id.type] = item.count;
    });

    res.json(Object.entries(formatted).map(([date, counts]) => ({ date, ...counts })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Creator's own dashboard (total views, likes, comments across all their videos)
exports.getCreatorDashboard = async (req, res) => {
  try {
    const userId = req.user._id; // from protect middleware

    // Get all videos of the creator
    const videos = await Video.find({ uploader: userId }).select('_id');
    const videoIds = videos.map(v => v._id);

    // Aggregate analytics for those videos
    const dashboard = await AnalyticsEvent.aggregate([
      { $match: { video: { $in: videoIds } } },
      { 
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert array to object
    const stats = {};
    dashboard.forEach(d => { stats[d._id] = d.count; });

    // Also get subscriber count from User model if subscription logic exists
    // For now, just return stats
    res.json({
      totalViews: stats.view || 0,
      totalLikes: stats.like || 0,
      totalDislikes: stats.dislike || 0,
      totalComments: stats.comment || 0,
      totalVideos: videoIds.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};