const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { controlMotor, getLogs, getStatus } = require('../controllers/motorController');

router.use(protect);
router.post('/control', controlMotor);
router.get('/logs', getLogs);
router.get('/status', getStatus);

module.exports = router;
