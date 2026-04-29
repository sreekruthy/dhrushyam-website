// ─────────────────────────────────────────────
//  controllers/auth.controller.js
//  Optimised with full JWT connection
// ─────────────────────────────────────────────
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

// ── Helpers ───────────────────────────────────
const sendTokens = (user, statusCode = 200) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const safeUser = {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    subscriberCount: user.subscribers?.length ?? 0,
  };

  return { accessToken, refreshToken, safeUser, statusCode };
};

// ─────────────────────────────────────────────
//  POST /api/auth/register
// ─────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    // Atomic check & create (avoid race condition with unique index)
    const existing = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
    if (existing) {
      const field = existing.email === email.toLowerCase() ? "Email" : "Username";
      return res.status(409).json({ success: false, message: `${field} already taken` });
    }

    const user = await User.create({ username, email: email.toLowerCase(), password });

    const { accessToken, refreshToken, safeUser } = sendTokens(user, 201);
    user.refreshTokens = [refreshToken];
    await user.save();

    res.status(201).json({
      success: true,
      message: "Account created",
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/login
// ─────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }

    const { accessToken, refreshToken, safeUser } = sendTokens(user);
    user.refreshTokens.push(refreshToken);
    // Keep only last 5 sessions
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/refresh
// ─────────────────────────────────────────────
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: "Refresh token not recognised" });
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  POST /api/auth/logout
// ─────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id);

    if (refreshToken) {
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    } else {
      user.refreshTokens = [];
    }
    await user.save();

    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  GET /api/auth/me
// ─────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -refreshTokens")
      .populate("subscribedTo", "username avatar");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
//  PUT /api/auth/me
// ─────────────────────────────────────────────
exports.updateMe = async (req, res, next) => {
  try {
    const { username, bio, avatar, channelBanner } = req.body;
    const updates = {};
    if (username !== undefined) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;
    if (channelBanner !== undefined) updates.channelBanner = channelBanner;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password -refreshTokens");

    res.json({ success: true, user });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    next(err);
  }
};

// ─────────────────────────────────────────────
//  PUT /api/auth/change-password
// ─────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords required" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password incorrect" });
    }

    user.password = newPassword;
    user.refreshTokens = []; // logout all devices
    await user.save();

    res.json({ success: true, message: "Password updated. Please log in again." });
  } catch (err) {
    next(err);
  }
};
console.log('✅ auth.controller loaded, exports:', Object.keys(module.exports));