const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getInsights, generateCropInsights, generateFertilizerInsights, generateIrrigationInsights } = require('../controllers/insightsController');

router.use(protect);
router.get('/', getInsights);

// Crop ML & Gemini Caching Routes
router.post('/crop', generateCropInsights);
router.post('/crop/regenerate', (req, res, next) => {
    req.body.forceRegenerate = true;
    generateCropInsights(req, res, next);
});

// Fertilizer ML & Gemini Caching Routes
router.post('/fertilizer', generateFertilizerInsights);
router.post('/fertilizer/regenerate', (req, res, next) => {
    req.body.forceRegenerate = true;
    generateFertilizerInsights(req, res, next);
});

// Irrigation Prediction & Gemini 2.0 Flash Routes
router.post('/irrigation', generateIrrigationInsights);
router.post('/irrigation/regenerate', (req, res, next) => {
    req.body.forceRegenerate = true;
    generateIrrigationInsights(req, res, next);
});

module.exports = router;
