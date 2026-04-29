// ─────────────────────────────────────────────
//  config/db.js  —  MongoDB connection via Mongoose
//  Called once at startup from server.js.
// ─────────────────────────────────────────────
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options silence deprecation warnings in Mongoose 7+
    });
    console.log(`✅  Dhrushyam DB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1); // Kill the process so Docker/PM2 can restart it
  }
};

module.exports = connectDB;
