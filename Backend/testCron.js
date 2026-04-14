const connectDB = require('./config/db');
const { pollThingSpeak } = require('./jobs/fetchThingSpeak');

require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    await connectDB();
    await pollThingSpeak();
    await mongoose.connection.close();
})();
