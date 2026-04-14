const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateProfile, updateApiKey, getProfile } = require('../controllers/profileController');

router.use(protect);
router.get('/', getProfile);
router.put('/update', updateProfile);
router.put('/api-key', updateApiKey);

module.exports = router;
