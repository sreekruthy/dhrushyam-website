const Video = require('../models/Video');

// Most viewed videos globally, paginated, exclude a specific video (if provided via query)
exports.getMostViewed = async (req, res) => {
  try {
    const { exclude, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (exclude) filter._id = { $ne: exclude };

    const videos = await Video.find(filter)
      .sort({ views: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('uploader', 'name avatar');

    const total = await Video.countDocuments(filter);
    res.json({ videos, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sidebar recommendations: most-viewed, excluding current video, limited to 10
exports.getSidebarRecommendations = async (req, res) => {
  try {
    const { videoId } = req.params;
    const videos = await Video.find({ _id: { $ne: videoId } })
      .sort({ views: -1 })
      .limit(10)
      .populate('uploader', 'name avatar');
    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};