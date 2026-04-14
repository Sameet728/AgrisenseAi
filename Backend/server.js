require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initCronJobs } = require('./jobs/fetchThingSpeak');

const app = express();
connectDB();

// Initialize automated background sync
initCronJobs();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/sensor', require('./routes/sensorRoutes'));
app.use('/api/insights', require('./routes/insightsRoutes'));
app.use('/api/motor', require('./routes/motorRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/data', require('./routes/dataRoutes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});
app.get("/", (req, res) => {
  res.send("Workign");
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 AgriSense AI Server running on port ${PORT}`));
