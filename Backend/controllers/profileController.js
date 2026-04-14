const User = require('../models/User');

const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, location, cropType, soilType, soilColor, farmSize, irrigationType, thingSpeakApiKey, language } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (cropType !== undefined) user.cropType = cropType;
    if (soilType !== undefined) user.soilType = soilType;
    if (soilColor !== undefined) user.soilColor = soilColor;
    if (farmSize !== undefined) user.farmSize = farmSize;
    if (irrigationType !== undefined) user.irrigationType = irrigationType;
    if (language !== undefined && ['en', 'mr'].includes(language)) user.language = language;
    if (thingSpeakApiKey !== undefined) user.thingSpeakApiKey = thingSpeakApiKey;

    await user.save();
    const userData = user.toObject();
    delete userData.password;
    res.json({ success: true, data: userData });
  } catch (error) {
    next(error);
  }
};

const updateApiKey = async (req, res, next) => {
  try {
    const { thingSpeakApiKey } = req.body;
    if (!thingSpeakApiKey) return res.status(400).json({ success: false, message: 'API key is required' });
    await User.findByIdAndUpdate(req.user._id, { thingSpeakApiKey }, { new: true });
    res.json({ success: true, message: 'API key updated successfully' });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { updateProfile, updateApiKey, getProfile };
