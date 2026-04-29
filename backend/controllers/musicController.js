const MusicTrack = require('../models/MusicTrack');

exports.getAllTracks = async (req, res) => {
  try {
    const { genre, search, sort = '-createdAt' } = req.query;
    const filter = {};
    if (genre) filter.genre = genre;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tracks = await MusicTrack.find(filter)
      .sort(sort)
      .populate('uploadedBy', 'name');
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrack = async (req, res) => {
  try {
    const track = await MusicTrack.findById(req.params.id)
      .populate('uploadedBy', 'name');
    if (!track) return res.status(404).json({ message: 'Track not found' });
    res.json(track);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.playTrack = async (req, res) => {
  try {
    const track = await MusicTrack.findByIdAndUpdate(
      req.params.id,
      { $inc: { plays: 1 } },
      { new: true }
    );
    if (!track) return res.status(404).json({ message: 'Track not found' });
    res.json({ plays: track.plays });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likeTrack = async (req, res) => {
  try {
    const trackId = req.params.id;
    const userId = req.user._id;

    const track = await MusicTrack.findById(trackId);
    if (!track) return res.status(404).json({ message: 'Track not found' });

    const index = track.likes.indexOf(userId);
    if (index === -1) {
      track.likes.push(userId);
    } else {
      track.likes.splice(index, 1);
    }
    await track.save();
    res.json({ likes: track.likes.length, liked: index === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Optional upload handler (may be shared with Member 1)
exports.uploadTrack = async (req, res) => {
  try {
    // Assume file upload handled by multer middleware in route
    // For now just use hardcoded URL for demo, but in real app you'd use the uploaded file path
    const { title, artist, album, genre, duration, fileUrl } = req.body;
    const track = await MusicTrack.create({
      title,
      artist,
      album,
      genre,
      duration,
      fileUrl,
      uploadedBy: req.user._id
    });
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};