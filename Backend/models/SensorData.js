const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moisture: { type: Number },
  temperature: { type: Number },
  humidity: { type: Number },
  soilTemp: { type: Number },
  ldr: { type: Number },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('SensorData', sensorDataSchema);
