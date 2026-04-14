const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getHistory } = require('../controllers/dataController');

router.use(protect);
router.get('/history', getHistory);

module.exports = router;
