require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const SensorData = require('./models/SensorData');
const MotorLog = require('./models/MotorLog');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('❌ MONGO_URI not found in .env');
    process.exit(1);
}

const seedDatabase = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // ⚠️ Clear existing data (safe for dev, never run on prod without backup)
        await User.deleteMany({});
        await SensorData.deleteMany({});
        await MotorLog.deleteMany({});
        console.log('🗑️  Cleared all collections');

        // 1️⃣ Create Test Users (pre-save hook auto-hashes passwords)
        const users = await User.create([
            { name: 'John Farmer', email: 'john@agrisense.com', password: 'SecurePass123!' },
            { name: 'Jane Agronomist', email: 'jane@agrisense.com', password: 'SecurePass123!' }
        ]);
        console.log(`👤 Created ${users.length} users`);

        // 2️⃣ Generate Sensor Data (48 hours of hourly readings)
        const sensorRecords = [];
        const now = Date.now();
        const hoursToSimulate = 48;
        const intervalMs = 1000 * 60 * 60; // 1 hour

        users.forEach(user => {
            for (let i = hoursToSimulate; i >= 0; i--) {
                sensorRecords.push({
                    userId: user._id,
                    moisture: Math.floor(Math.random() * 40) + 30,      // 30-70%
                    temperature: parseFloat((Math.random() * 15 + 20).toFixed(1)), // 20-35°C
                    humidity: Math.floor(Math.random() * 30) + 50,      // 50-80%
                    soilTemp: parseFloat((Math.random() * 10 + 15).toFixed(1)),    // 15-25°C
                    ldr: Math.floor(Math.random() * 800) + 200,         // 200-1000 lux
                    timestamp: new Date(now - i * intervalMs)
                });
            }
        });

        await SensorData.insertMany(sensorRecords);
        console.log(`📊 Inserted ${sensorRecords.length} sensor records`);

        // 3️⃣ Generate Motor Logs (every 2 hours for 40 hours)
        const motorRecords = [];
        const statuses = ['ON', 'OFF'];
        const modes = ['auto', 'manual'];

        users.forEach(user => {
            for (let i = 20; i >= 0; i--) {
                motorRecords.push({
                    userId: user._id,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    mode: modes[Math.floor(Math.random() * modes.length)],
                    timestamp: new Date(now - i * 1000 * 60 * 60 * 2)
                });
            }
        });

        await MotorLog.insertMany(motorRecords);
        console.log(`⚙️  Inserted ${motorRecords.length} motor logs`);

        // Clean exit
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        console.log('🎉 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        await mongoose.connection.close();
        process.exit(1);
    }
};

seedDatabase();