const mongoose = require('mongoose');

const cropInsightSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  inputData: {
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    ph: Number,
    rainfall: Number,
    temperature: Number,
    district_name: String,
    soil_color: String
  },
  recommendedCrop: { type: String, required: true },
  aiInsights: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CropInsight', cropInsightSchema);
