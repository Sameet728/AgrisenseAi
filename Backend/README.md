# 🌾 AgriSense AI — Backend

> **RESTful API Server powering the AgriSense AI Smart Farming Platform**
> Node.js · Express.js · MongoDB · JWT · ThingSpeak IoT Integration

---

## 📖 Overview

The AgriSense AI Backend is the server-side engine of the AgriSense AI smart farming platform. It provides a secure, scalable RESTful API that bridges the mobile application (Expo React Native) with IoT sensor data streams, AI-powered agricultural insights, and real-time irrigation motor control.

Built on **Node.js + Express.js** with **MongoDB** as the primary data store, the backend handles user authentication, sensor data management, AI insight delivery, motor command publishing, and integration with external data providers such as the **ThingSpeak IoT API** and **Weather API**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication & Authorization** | JWT-based auth with register / login / token refresh and protected route middleware |
| 👤 **User Management** | User profile CRUD, API key storage (ThingSpeak), and account settings |
| 📡 **IoT Sensor Data** | Real-time and historical sensor feeds via ThingSpeak channel integration (soil moisture, temperature, humidity, soil temp, LDR, motor status) |
| 🤖 **AI Insights Engine** | Severity-classified smart alerts generated from sensor readings (critical / warning / optimal) |
| 💧 **Motor / Irrigation Control** | Auto and manual motor toggle commands, activity log persistence |
| 🌦️ **Weather Integration** | External weather API proxy for location-based temperature, rainfall, and forecast data |
| 🗄️ **MongoDB Storage** | Persistent storage of users, sensor snapshots, insights, and motor activity logs |
| 🛡️ **Middleware Stack** | Request validation, rate limiting, CORS, error handling, and authentication guards |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js ≥ 18 | Server runtime |
| **Framework** | Express.js | HTTP server & routing |
| **Database** | MongoDB | Primary data store |
| **ODM** | Mongoose | Schema modeling & queries |
| **Authentication** | JSON Web Tokens (JWT) | Stateless auth |
| **Password Security** | bcryptjs | Password hashing |
| **IoT Integration** | Axios + ThingSpeak REST API | Sensor data fetching |
| **Weather** | WeatherAPI / OpenWeatherMap | External weather data |
| **Environment Config** | dotenv | Environment variable management |
| **Dev Server** | nodemon | Hot-reload for development |
| **CORS** | cors | Cross-origin request handling |
| **Validation** | express-validator | Request body validation |

---

## 📁 Project Structure

```
Backend/
├── server.js                   # Entry point — Express app bootstrap & DB connect
├── app.js                      # App configuration, middleware registration
├── package.json
├── .env.example                # Environment variable template
│
├── config/
│   └── db.js                   # MongoDB connection (Mongoose)
│
├── middleware/
│   ├── authMiddleware.js        # JWT verification — protects private routes
│   ├── errorMiddleware.js       # Global error handler
│   └── validateRequest.js      # express-validator error formatter
│
├── models/
│   ├── User.js                  # User schema (name, email, password, apiKey, channelId)
│   ├── SensorSnapshot.js        # Persisted sensor reading document
│   ├── Insight.js               # AI insight record (message, severity, timestamp)
│   └── MotorLog.js              # Motor activity log (action, mode, timestamp)
│
├── routes/
│   ├── authRoutes.js            # POST /api/auth/register, /api/auth/login
│   ├── userRoutes.js            # GET/PUT /api/user/profile, /api/user/apikey
│   ├── sensorRoutes.js          # GET /api/sensors/latest, /api/sensors/history
│   ├── insightRoutes.js         # GET /api/insights
│   └── motorRoutes.js           # GET/POST /api/motor/status, /api/motor/toggle
│
├── controllers/
│   ├── authController.js        # register(), login(), refreshToken()
│   ├── userController.js        # getProfile(), updateProfile(), updateApiKey()
│   ├── sensorController.js      # getLatest(), getHistory() — proxies ThingSpeak
│   ├── insightController.js     # getInsights() — generates AI alerts from sensor data
│   └── motorController.js       # getMotorStatus(), toggleMotor(), getActivityLog()
│
└── utils/
    ├── generateToken.js         # JWT sign helper
    ├── thingspeakClient.js      # Axios wrapper for ThingSpeak channel API
    └── insightEngine.js         # Rule-based AI logic: sensor thresholds → insights
```

---

## ⚙️ Installation & Setup

### Prerequisites

- Node.js ≥ 18
- MongoDB (local instance or MongoDB Atlas URI)
- ThingSpeak account with a configured channel
- (Optional) WeatherAPI key for weather data

### 1. Clone the Repository

```bash
git clone https://github.com/Sameet728/AgrisenseAi.git
cd AgrisenseAi/Backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/agrisense
# or for Atlas:
# MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/agrisense

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# ThingSpeak (default / fallback channel)
THINGSPEAK_BASE_URL=https://api.thingspeak.com

# Weather API (optional)
WEATHER_API_KEY=your_weatherapi_key
WEATHER_API_URL=https://api.weatherapi.com/v1
```

### 4. Start the Server

```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

Server starts at: `http://localhost:5000`

---

## 🔌 API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new farmer account | ❌ |
| `POST` | `/api/auth/login` | Login and receive JWT token | ❌ |

**Register Request Body:**
```json
{
  "name": "Rajesh Patil",
  "email": "rajesh.patil@farm.com",
  "password": "farm@1234"
}
```

**Login Response:**
```json
{
  "success": true,
  "token": "<JWT>",
  "user": {
    "id": "...",
    "name": "Rajesh Patil",
    "email": "rajesh.patil@farm.com"
  }
}
```

---

### User Profile

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/user/profile` | Get current user profile | ✅ |
| `PUT` | `/api/user/profile` | Update name / email | ✅ |
| `PUT` | `/api/user/apikey` | Save ThingSpeak API key + Channel ID | ✅ |

---

### Sensor Data

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/sensors/latest` | Fetch latest sensor reading from ThingSpeak | ✅ |
| `GET` | `/api/sensors/history?results=10` | Fetch last N sensor readings | ✅ |

**Sample Response — `/api/sensors/latest`:**
```json
{
  "success": true,
  "data": {
    "moisture":    68.4,
    "temperature": 29.1,
    "humidity":    72.3,
    "soilTemp":    24.8,
    "ldr":         540,
    "motor":       "OFF",
    "timestamp":   "2025-06-04T10:32:00Z"
  }
}
```

---

### AI Insights

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/insights` | Get AI-generated alerts based on sensor readings | ✅ |
| `GET` | `/api/insights?severity=critical` | Filter by severity (`critical`, `warning`, `optimal`) | ✅ |

**Sample Response:**
```json
{
  "success": true,
  "insights": [
    {
      "id": "ins_001",
      "severity": "warning",
      "message": "Soil moisture at 38% — consider irrigation within 2 hours.",
      "sensor": "moisture",
      "timestamp": "2025-06-04T10:32:00Z"
    }
  ]
}
```

---

### Motor / Irrigation Control

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/motor/status` | Get current motor state (ON/OFF) and mode | ✅ |
| `POST` | `/api/motor/toggle` | Toggle motor ON/OFF or set to auto mode | ✅ |
| `GET` | `/api/motor/log` | Retrieve motor activity history | ✅ |

**Toggle Request Body:**
```json
{
  "action": "ON",
  "mode": "manual"
}
```

---

## 🗃️ Database Schemas

### User
```js
{
  name:       String,   // required
  email:      String,   // required, unique
  password:   String,   // bcrypt hashed
  apiKey:     String,   // ThingSpeak Read API Key
  channelId:  String,   // ThingSpeak Channel ID
  createdAt:  Date
}
```

### SensorSnapshot
```js
{
  userId:      ObjectId,
  moisture:    Number,
  temperature: Number,
  humidity:    Number,
  soilTemp:    Number,
  ldr:         Number,
  motor:       String,   // "ON" | "OFF"
  recordedAt:  Date
}
```

### Insight
```js
{
  userId:    ObjectId,
  message:   String,
  severity:  String,     // "critical" | "warning" | "optimal"
  sensor:    String,
  createdAt: Date
}
```

### MotorLog
```js
{
  userId:    ObjectId,
  action:    String,     // "ON" | "OFF"
  mode:      String,     // "manual" | "auto"
  timestamp: Date
}
```

---

## 🌐 ThingSpeak Integration

The backend proxies ThingSpeak API requests on behalf of authenticated users using their stored API key and Channel ID. This keeps credentials server-side and off the mobile client.

```
GET https://api.thingspeak.com/channels/{channelId}/feeds/last.json?api_key={apiKey}
```

**Field Mapping:**

| ThingSpeak Field | Sensor |
|---|---|
| `field1` | Soil Moisture (%) |
| `field2` | Air Temperature (°C) |
| `field3` | Humidity (%) |
| `field4` | Soil Temperature (°C) |
| `field5` | LDR / Light Intensity |
| `field6` | Motor Status (1 = ON, 0 = OFF) |

---

## 🔒 Security

- All private routes require a valid `Authorization: Bearer <token>` header
- Passwords are hashed with **bcryptjs** (salt rounds: 10)
- JWT tokens expire in 7 days (configurable via `JWT_EXPIRES_IN`)
- Environment secrets are never committed — use `.env` locally
- CORS configured to allow only trusted origins in production

---

## 🚀 Deployment

### Environment Variables (Production)

Ensure the following are set in your hosting environment (Railway, Render, Heroku, VPS, etc.):

```
NODE_ENV=production
PORT=5000
MONGO_URI=<Atlas URI>
JWT_SECRET=<strong random secret>
WEATHER_API_KEY=<key>
```

### PM2 (Recommended for VPS)

```bash
npm install -g pm2
pm2 start server.js --name agrisense-backend
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

```bash
docker build -t agrisense-backend .
docker run -p 5000:5000 --env-file .env agrisense-backend
```

---

## 🧪 Testing the API

Use the following base URL for local development:

```
http://localhost:5000/api
```

**Quick health check:**
```bash
curl http://localhost:5000/api/health
# → { "status": "ok", "uptime": 123.4 }
```

**Demo login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh.patil@farm.com","password":"farm@1234"}'
```

---

## 📦 Dependencies

```json
{
  "express":             "^4.x",
  "mongoose":            "^7.x",
  "jsonwebtoken":        "^9.x",
  "bcryptjs":            "^2.x",
  "axios":               "^1.x",
  "dotenv":              "^16.x",
  "cors":                "^2.x",
  "express-validator":   "^7.x",
  "nodemon":             "^3.x"  // devDependency
}
```

---

## 🗺️ Roadmap

- [ ] WebSocket support for real-time sensor push (Socket.io)
- [ ] Scheduled auto-irrigation based on moisture threshold (node-cron)
- [ ] Crop recommendation endpoint (ML model integration)
- [ ] Disease detection image upload + inference pipeline
- [ ] Yield prediction API
- [ ] Swagger / OpenAPI documentation
- [ ] Unit & integration tests (Jest + Supertest)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

*Made with ❤️ for Indian farmers | AgriSense AI Backend v1.0*
