// ─────────────────────────────────────────────
//  models/User.js  —  Mongoose User schema
//
//  Key design decisions:
//  • Password hashing happens in a pre-save hook,
//    so it's automatic for register AND password
//    change flows — you never forget to hash.
//  • refreshTokens is an array so one user can be
//    logged in on multiple devices simultaneously.
//  • subscribers / subscribedTo let Member 2's
//    recommendation feed query related channels.
// ─────────────────────────────────────────────
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never return password in queries by default
    },

    // Profile info
    avatar: { type: String, default: "" },          // URL to avatar image
    channelBanner: { type: String, default: "" },   // Member 4 displays this
    bio: { type: String, default: "", maxlength: 500 },

    // Channel stats — updated by Member 2's subscription endpoints
    subscribers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    subscribedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Refresh token store — supports multi-device login
    // Each element is one device's current valid refresh token
    refreshTokens: [{ type: String }],

    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

// ── Pre-save hook: hash password before storing ──
userSchema.pre("save", async function (next) {
  // Only re-hash if the password field was actually changed
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(12); // 12 rounds is a good balance of security/speed
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method: compare plain text vs hash ──
// Usage: const isMatch = await user.comparePassword(plainText)
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: subscriber count (avoids storing a separate number) ──
userSchema.virtual("subscriberCount").get(function () {
  return this.subscribers.length;
});

module.exports = mongoose.model("User", userSchema);
