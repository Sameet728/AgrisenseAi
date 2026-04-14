const mongoose = require('mongoose');

const MAX_RETRIES  = 5;
const RETRY_DELAY  = 5000; // 5 seconds between retries

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 s to find a server
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Reconnect automatically if connection drops later
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — attempting reconnect...');
      setTimeout(() => connectDB(), RETRY_DELAY);
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err.message);
    });

  } catch (error) {
    console.error(`❌ MongoDB Connection Error (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY / 1000}s...`);
      setTimeout(() => connectDB(attempt + 1), RETRY_DELAY);
    } else {
      console.error('💥 All MongoDB connection attempts failed. Server will keep running but DB calls will fail.');
      // ⚠️  Do NOT call process.exit() — keep the HTTP server alive so the
      //     app doesn't show a network error; DB-dependent routes will return 500
      //     while we wait for Atlas to become reachable.
    }
  }
};

module.exports = connectDB;
