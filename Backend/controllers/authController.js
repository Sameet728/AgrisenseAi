const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const signup = async (req, res, next) => {
  try {
    const { name, email, password, language = 'en' } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await User.create({ name, email, password, language });
    const userData = user.toObject();
    delete userData.password;
    userData.token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const userData = user.toObject();
    delete userData.password;
    userData.token = generateToken(user._id);

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login };
