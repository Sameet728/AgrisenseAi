const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCurrent, getHistory, storeData } = require('../controllers/sensorController');

router.use(protect);
router.get('/current', getCurrent);
router.get('/history', getHistory);
router.post('/store', storeData); // IoT ingestion endpoint

module.exports = router;
