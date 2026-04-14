const mongoose = require('mongoose');

const sensorHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  soil: { type: Number, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  soilTemp: { type: Number, required: true },
  light: { type: Number, required: true },
  motor: { type: String, enum: ['ON', 'OFF'], required: true },
  mode: { type: String, enum: ['auto', 'manual'], required: true },
  timestamp: { type: Date, required: true, index: true }
}, { timestamps: true });

// Compound index to optimize looking up a specific user's temporal data
sensorHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorHistory', sensorHistorySchema);
