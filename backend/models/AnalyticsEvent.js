const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['view', 'like', 'dislike', 'comment', 'share', 'download'], 
    required: true 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // can be anonymous
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed } // extra info (e.g., watch time)
});

// Index for quick aggregation by video and date
analyticsEventSchema.index({ video: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model('AnalyticsEvent', analyticsEventSchema);