const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const SensorHistory = require('./models/SensorHistory');
require('dotenv').config();

const seedHistoricalData = async () => {
  await connectDB();
  try {
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No users found in database to seed data for.');
      return;
    }
    
    await SensorHistory.deleteMany({});
    console.log('Cleared existing history records.');

    for (const user of users) {
      const records = [];
      const now = new Date();
      
      // Seed 24 records (one every 4 hours for the past 4 days)
      for (let i = 0; i < 24; i++) {
        const d = new Date(now);
        d.setHours(d.getHours() - (i * 4));
        
        // Randomize data logically for testing graphs
        records.push({
          userId: user._id,
          soil: Math.floor(Math.random() * (70 - 30 + 1) + 30), // 30-70%
          temperature: (Math.random() * (35 - 20) + 20).toFixed(1), // 20-35 C
          humidity: (Math.random() * (90 - 45) + 45).toFixed(1), // 45-90%
          soilTemp: (Math.random() * (28 - 20) + 20).toFixed(1), // 20-28 C
          light: Math.floor(Math.random() * (100 - 10 + 1) + 10), // 10-100%
          motor: Math.random() > 0.8 ? 'ON' : 'OFF',
          mode: Math.random() > 0.5 ? 'auto' : 'manual',
          timestamp: d
        });
      }
      
      await SensorHistory.insertMany(records);
      console.log(`Seeded 24 historical records for user: ${user.name}`);
    }

    console.log('Database seeding complete!');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedHistoricalData();
