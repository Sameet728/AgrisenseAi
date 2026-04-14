const mongoose = require('mongoose');

const motorLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['ON', 'OFF'], required: true },
  mode: { type: String, enum: ['auto', 'manual'], default: 'manual' },
  duration: { type: Number, default: null }, // Duration in minutes for auto-shutoff timers
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MotorLog', motorLogSchema);
