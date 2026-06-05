<div align="center">

# 🌾 AgriSense AI

### Smart Farming. Real Insights. Powered by IoT + AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-61DAFB?logo=react)](https://expo.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?logo=google&logoColor=white)](https://aistudio.google.com)

**AgriSense AI is a full-stack IoT-powered smart farming platform that gives Indian farmers real-time sensor monitoring, AI-driven crop & fertilizer recommendations, and automated irrigation control — right from their phone.**

[Backend Docs](./Backend/README.md) · [Mobile App Docs](./AgriSenseAI/README.md) · [Report Bug](https://github.com/Sameet728/AgrisenseAi/issues) · [Request Feature](https://github.com/Sameet728/AgrisenseAi/issues)

</div>

---

## 📱 What Is AgriSense AI?

AgriSense AI connects IoT sensors on the farm to a farmer's smartphone through a cloud backend powered by AI. Using an ESP32 microcontroller and ThingSpeak as the IoT data bridge, it reads soil moisture, temperature, humidity, soil temperature, LDR light intensity, and NPK nutrients in real time.

On top of that raw data, a Node.js backend runs ML-based crop and fertilizer predictions and then passes the results to **Google Gemini 2.5 Flash** to generate human-readable advisory reports in the farmer's preferred language (English or Marathi). Irrigation motor commands are written back to ThingSpeak so the farmer can start or stop pumps from anywhere, with optional auto-shutoff timers.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FARM (Hardware)                          │
│  ESP32 + DHT22 + DS18B20 + Soil Probe + LDR + NPK Sensor       │
│                          │ WiFi                                  │
│                          ▼                                       │
│               ┌─────────────────┐                               │
│               │   ThingSpeak    │  ← IoT Cloud Data Bridge      │
│               │  Channel 3337913│  field1–8 (sensor + motor)    │
│               └────────┬────────┘                               │
└────────────────────────│────────────────────────────────────────┘
                         │ HTTPS
         ┌───────────────▼───────────────┐
         │     AgriSense AI Backend      │   Node.js + Express
         │     (REST API Server)         │   MongoDB + Mongoose
         │                               │   Google Gemini 2.5 Flash
         │  ┌─────────┐  ┌────────────┐  │   node-cron background jobs
         │  │  Auth   │  │  Insights  │  │
         │  │ Sensor  │  │   Motor    │  │
         │  │ Profile │  │   Data     │  │
         │  └─────────┘  └────────────┘  │
         │         │              │       │
         │   ┌─────▼──────┐  ┌───▼────┐  │
         │   │  MongoDB   │  │Gemini  │  │
         │   │  Atlas     │  │  AI    │  │
         │   └────────────┘  └───┬────┘  │
         │                       │       │
         │   ┌───────────────────▼────┐  │
         │   │ ML Microservice        │  │
         │   │ predictcrop.onrender   │  │
         │   │ /predict-crop          │  │
         │   │ /predict-fertilizer    │  │
         │   │ /predict-irrigation    │  │
         │   └────────────────────────┘  │
         └───────────────┬───────────────┘
                         │ REST API + JWT
         ┌───────────────▼───────────────┐
         │   AgriSense AI Mobile App     │   Expo React Native
         │                               │   iOS + Android
         │  ┌──────────┐ ┌─────────────┐ │
         │  │Dashboard │ │AI Insights  │ │
         │  │  Charts  │ │ Crop Rec.   │ │
         │  │ Sensor   │ │ Fertilizer  │ │
         │  │  Cards   │ │ Irrigation  │ │
         │  └──────────┘ └─────────────┘ │
         │  ┌──────────┐ ┌─────────────┐ │
         │  │  Motor   │ │   Profile   │ │
         │  │ Control  │ │  Settings   │ │
         │  └──────────┘ └─────────────┘ │
         └───────────────────────────────┘
```

---

## ✨ Features at a Glance

### 📡 Real-Time IoT Monitoring
- Live sensor readings: soil moisture, temperature, humidity, soil temperature, LDR light, NPK levels
- Sensor status indicators: 🟢 Optimal · 🟡 Warning · 🔴 Critical
- Pull-to-refresh and trend line charts in the mobile app
- Hourly background sync stores all readings to MongoDB for historical analysis

### 🤖 AI-Powered Insights
- **Crop Recommendation** — ML prediction + Gemini 2.5 Flash report with soil analysis, weather suitability, farming tips, and risks
- **Fertilizer Recommendation** — ML prediction + Gemini report with application strategy and precautions
- **Irrigation Advisory** — Live soil-moisture rule (< 30% → irrigate) + Gemini narrative with water management tips
- All insights cached per user; force-regenerate available

### 💧 Irrigation Motor Control
- Toggle motor ON/OFF via REST API → ThingSpeak field6 write
- Manual and Auto modes via field7
- Auto-shutoff timer: set duration in minutes, backend cron fires OFF after expiry (with retry logic)
- Full activity log with timestamps

### 🔐 Secure Multi-User Auth
- JWT-based authentication (90-day tokens)
- bcryptjs password hashing (12 rounds)
- Per-user ThingSpeak API key storage — server proxies all IoT calls
- Language preference: English or Marathi

### 📊 Historical Data & Charts
- Week / month / year / custom date range filters
- Up to 15,000 time-series records returned per query
- Compound MongoDB index on `(userId, timestamp)` for fast queries

---

## 🗂️ Repository Structure

```
AgrisenseAi/
│
├── Backend/                        # Node.js + Express REST API
│   ├── server.js                   # Entry point
│   ├── config/db.js                # MongoDB resilient connection
│   ├── middleware/authMiddleware.js # JWT guard
│   ├── routes/                     # authRoutes, sensorRoutes, insightsRoutes,
│   │                               #   motorRoutes, profileRoutes, dataRoutes
│   ├── controllers/                # authController, sensorController,
│   │                               #   insightsController, motorController,
│   │                               #   profileController, dataController
│   ├── models/                     # User, SensorData, SensorHistory, CropInsight,
│   │                               #   FertilizerInsight, IrrigationInsight,
│   │                               #   MotorLog, MotorTimer
│   ├── jobs/fetchThingSpeak.js     # Cron: hourly sync + 15s motor timer poll
│   └── utils/generateToken.js      # JWT sign helper
│
└── AgriSenseAI/                    # Expo React Native Mobile App
    ├── App.js                      # Root entry point
    ├── navigation/AppNavigator.js  # Stack + Bottom Tab navigator
    ├── screens/                    # Login, Signup, Dashboard, Insights,
    │                               #   Motor, Profile
    ├── components/                 # SensorCard, InsightCard, MotorToggle,
    │                               #   Button, Input, Card, Header, LoadingScreen
    ├── services/api.js             # REST API client (Axios)
    ├── context/AuthContext.js      # Global auth state
    ├── data/seed.js                # Mock sensor + insight data
    ├── constants/theme.js          # Colors, fonts, spacing
    └── utils/sensorHelpers.js      # Status logic & sensor color mapping
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)
- Expo CLI + Expo Go app on your phone
- Google Gemini API key — [get one free](https://aistudio.google.com/app/apikey)
- ThingSpeak account with an IoT channel

---

### 1. Clone the Repository

```bash
git clone https://github.com/Sameet728/AgrisenseAi.git
cd AgrisenseAi
```

---

### 2. Start the Backend

```bash
cd Backend
npm install
```

Create `Backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/agrisense
JWT_SECRET=your_super_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
```

```bash
npm run dev
# 🚀 AgriSense AI Server running on port 5000
# ✅ MongoDB Connected
# [CRON] Scheduled ThingSpeak historical sync (Hourly)
# [CRON] Scheduled Motor Timer poll (Every 15s)
```

---

### 3. Start the Mobile App

```bash
cd ../AgriSenseAI
npm install
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

---

### 4. Demo Login

```
Email:    rajesh.patil@farm.com
Password: farm@1234
```

Or tap **"Fill demo credentials"** on the login screen.

---

## 🌐 API Base URL

```
http://localhost:5000/api
```

| Route Group | Prefix | Auth |
|---|---|---|
| Authentication | `/api/auth` | ❌ Public |
| User Profile | `/api/profile` | ✅ JWT |
| Sensor Data | `/api/sensor` | ✅ JWT |
| AI Insights | `/api/insights` | ✅ JWT |
| Motor Control | `/api/motor` | ✅ JWT |
| Historical Data | `/api/data` | ✅ JWT |

> See [Backend/README.md](./Backend/README.md) for the full API reference.

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary green | `#1A6B3C` |
| Accent | `#4CAF50` |
| Background | `#F4F8F5` |
| Card shadow | `rgba(26,107,60, 0.12)` |
| Border radius | 6 / 10 / 16 / 24 px |

Sensor status colors:
- 🟢 **Green** — Optimal
- 🟡 **Yellow** — Warning
- 🔴 **Red** — Critical

---

## 🌐 ThingSpeak Field Map

| Field | Sensor | Conversion |
|---|---|---|
| field1 | Soil Moisture (ADC 0–4095) | `((4095 - val) / 4095) × 100` → % |
| field2 | Air Temperature (°C) | Direct float |
| field3 | Air Humidity (%) | Direct float |
| field4 | Soil Temperature (°C) | Dallas DS18B20 |
| field5 | LDR Light (ADC 0–4095) | `(val / 4095) × 100` → % |
| field6 | Motor Status | 1 = ON, 0 = OFF |
| field7 | Motor Mode | 1 = Auto, 0 = Manual |
| field8 | Encoded NPK | N×10000 + P×100 + K |

---

## 📦 Full Tech Stack

| Category | Technology |
|---|---|
| **Mobile** | Expo SDK ~51, React Native, React Navigation (Stack + Tabs) |
| **Charts** | react-native-chart-kit |
| **Local Storage** | @react-native-async-storage |
| **Icons** | @expo/vector-icons (Ionicons) |
| **Backend** | Node.js ≥ 18, Express.js 4.x |
| **Database** | MongoDB, Mongoose 8.x |
| **Auth** | jsonwebtoken (90d), bcryptjs (12 rounds) |
| **AI** | Google Gemini 2.5 Flash (@google/generative-ai) |
| **ML** | predictcrop.onrender.com (external microservice) |
| **IoT Bridge** | ThingSpeak REST API |
| **Scheduler** | node-cron 4.x |
| **HTTP Client** | Axios 1.x |

---

## 🗺️ Roadmap

- [ ] WebSocket / Socket.io for real-time sensor push (remove polling)
- [ ] Marathi language full UI translation
- [ ] Disease detection — image capture + CNN inference
- [ ] Offline-first mobile support with sync queue
- [ ] Swagger / OpenAPI documentation for backend
- [ ] Admin dashboard for multi-farm management
- [ ] Push notifications for critical sensor alerts
- [ ] Unit & integration tests (Jest + Supertest)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

*Made with ❤️ for Indian farmers | AgriSense AI v1.0*

**Empowering every farmer with technology that speaks their language.**

</div>
