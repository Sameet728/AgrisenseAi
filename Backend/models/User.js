const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: null },
  location: { type: String, default: null },
  cropType: { type: String, default: null },
  soilType: { type: String, default: null },
  soilColor: { type: String, default: null },
  farmSize: { type: String, default: null },
  irrigationType: { type: String, default: null },
  language: { type: String, enum: ['en', 'mr'], default: 'en' },
  thingSpeakApiKey: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
