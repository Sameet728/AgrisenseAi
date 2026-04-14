const mongoose = require('mongoose');

const irrigationInsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  inputData: {
    district_name: String,
    soil_color:    String,
    crop:          String,
    rainfall:      Number,
    temperature:   Number,
    humidity:      Number,
    soil_moisture: Number,
    soil_temperature: Number,
  },
  irrigationNeeded: { type: Boolean, required: true }, // true = water required
  aiInsights:       { type: String,  required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('IrrigationInsight', irrigationInsightSchema);
