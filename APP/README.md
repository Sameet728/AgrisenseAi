# 🌾 AgriSense AI

> Smart Farming. Real Insights. Powered by IoT + AI.

A production-ready Expo React Native application for farmers to monitor IoT-based agricultural sensor data and receive AI-powered insights in real time.

---

## 📱 Screenshots & Features

| Screen | Description |
|--------|-------------|
| **Login / Signup** | Auth with ThingSpeak API key setup |
| **Dashboard** | Live sensor cards + trend charts + nutrient bars |
| **AI Insights** | Smart alerts with severity filters |
| **Motor Control** | Auto/Manual irrigation with activity log |
| **Profile** | User info + API key management |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS / Android)

### Installation

```bash
# 1. Clone / unzip the project
cd AgriSenseAI

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

---

## 🔐 Demo Credentials

```
Email:    rajesh.patil@farm.com
Password: farm@1234
```

Or tap **"Fill demo credentials"** on the login screen.  
Any valid-looking email + 6+ character password will also work.

---

## 📁 Project Structure

```
AgriSenseAI/
├── App.js                      # Root entry point
├── app.json                    # Expo config
├── package.json
├── babel.config.js
│
├── assets/                     # Images, icons, splash
│
├── context/
│   └── AuthContext.js          # Global auth state (React Context)
│
├── navigation/
│   └── AppNavigator.js         # Stack + Bottom Tab navigator
│
├── screens/
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── DashboardScreen.js      # Main feature screen
│   ├── InsightsScreen.js       # AI-powered insights
│   ├── MotorScreen.js          # Irrigation motor control
│   └── ProfileScreen.js        # User profile + API key
│
├── components/
│   ├── Button.js               # Reusable button (5 variants)
│   ├── Input.js                # Reusable input with validation
│   ├── Card.js                 # Reusable card wrapper
│   ├── Header.js               # Screen header
│   ├── SensorCard.js           # Sensor reading card with status
│   ├── InsightCard.js          # AI insight card
│   ├── MotorToggle.js          # Animated motor toggle
│   ├── LoadingScreen.js        # Full-screen loader
│   └── ErrorView.js            # Error state with retry
│
├── services/
│   ├── api.js                  # Mock REST API (replace with real API)
│   └── storage.js              # AsyncStorage helpers
│
├── data/
│   └── seed.js                 # Mock sensor + user + insights data
│
├── constants/
│   ├── theme.js                # Colors, fonts, spacing, shadows
│   └── index.js                # All constants + re-exports
│
└── utils/
    ├── sensorHelpers.js        # Status logic, labels, colors
    └── index.js                # Shared utilities
```

---

## 🌐 Connecting Real ThingSpeak API

In `services/api.js`, replace the mock functions with real Axios calls:

```js
import axios from 'axios';

const BASE = 'https://api.thingspeak.com';

export const apiGetSensorData = async (apiKey, channelId) => {
  const res = await axios.get(
    `${BASE}/channels/${channelId}/feeds/last.json?api_key=${apiKey}`
  );
  return {
    moisture:    parseFloat(res.data.field1),
    temperature: parseFloat(res.data.field2),
    humidity:    parseFloat(res.data.field3),
    soilTemp:    parseFloat(res.data.field4),
    ldr:         parseFloat(res.data.field5),
    motor:       res.data.field6 === '1' ? 'ON' : 'OFF',
    timestamp:   res.data.created_at,
  };
};
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary green | `#1A6B3C` |
| Accent | `#4CAF50` |
| Background | `#F4F8F5` |
| Card shadow | `rgba(26,107,60, 0.12)` |
| Border radius | 6 / 10 / 16 / 24 px |

Sensor status colors:
- 🟢 **Green** — Optimal range
- 🟡 **Yellow** — Warning (mild deviation)
- 🔴 **Red** — Critical (immediate action needed)

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo` ~51 | Core Expo SDK |
| `@react-navigation/native` | Navigation |
| `@react-navigation/bottom-tabs` | Tab navigation |
| `@react-navigation/native-stack` | Stack navigation |
| `react-native-chart-kit` | Line charts |
| `@react-native-async-storage/async-storage` | Local storage |
| `axios` | HTTP client |
| `@expo/vector-icons` | Ionicons |
| `react-native-safe-area-context` | Safe area |
| `react-native-gesture-handler` | Gestures |

---

## 👨‍🌾 Built for Farmers

AgriSense AI is designed to be:
- **Simple** — Clean UI optimized for field use
- **Fast** — Pull-to-refresh for live data
- **Smart** — AI insights prioritized by severity
- **Reliable** — Offline-capable with AsyncStorage

---

*Made with ❤️ for Indian farmers | AgriSense AI v1.0*
