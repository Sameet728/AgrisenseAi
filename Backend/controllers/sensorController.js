const SensorData = require('../models/SensorData');

const getCurrent = async (req, res, next) => {
  try {
    const latest = await SensorData.findOne({ userId: req.user._id }).sort({ timestamp: -1 });
    res.json({ success: true, data: latest || null });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const history = await SensorData.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(limit);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

// Bonus: POST endpoint for IoT device data ingestion
const storeData = async (req, res, next) => {
  try {
    const sensorData = await SensorData.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, data: sensorData });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCurrent, getHistory, storeData };
