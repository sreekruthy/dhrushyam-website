const mongoose = require('mongoose');

const musicTrackSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: String,
  genre: String,
  duration: Number, // seconds
  fileUrl: { type: String, required: true },
  coverArt: String,
  plays: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MusicTrack', musicTrackSchema);