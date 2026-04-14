const CropInsight = require('../models/CropInsight');
const FertilizerInsight = require('../models/FertilizerInsight');
const IrrigationInsight = require('../models/IrrigationInsight');
const User = require('../models/User');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// MOCK CONSTANTS to gracefully fallback if missing
const MOCK_GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const generateCropInsights = async (req, res, next) => {
    try {
        const { profileData, forceRegenerate = false } = req.body;
        const userId = req.user._id;

        // 1. Evaluate cache
        if (!forceRegenerate) {
            const cached = await CropInsight.findOne({ userId });
            if (cached) {
                return res.json({ success: true, data: cached });
            }
        }

        // 2. Clear old cache if regenerating
        await CropInsight.deleteOne({ userId });

        // 3. Acquire User and API keys
        const user = await User.findById(userId).select('thingSpeakApiKey');

        // 4. Extract data from ThingSpeak securely (if key available)
        let tsTemperature = 20;
        let tsHumidity = 60;
        let tsNitrogen = profileData?.nitrogen || 110;
        let tsPhosphorus = profileData?.phosphorus || 65;
        let tsPotassium = profileData?.potassium || 45;

        if (user && user.thingSpeakApiKey) {
            try {
                const tsUrl = `https://api.thingspeak.com/channels/3337913/feeds.json?results=60&api_key=${user.thingSpeakApiKey}`;
                const tsResponse = await axios.get(tsUrl);
                const feeds = tsResponse.data?.feeds || [];
                // Search backwards for most-recent feed with data
                for (let i = feeds.length - 1; i >= 0; i--) {
                    const feed = feeds[i];
                    if (feed.field2) tsTemperature = parseFloat(feed.field2);
                    if (feed.field3) tsHumidity = parseFloat(feed.field3);
                    if (feed.field8) {
                        const encoded = parseInt(feed.field8, 10);
                        if (!isNaN(encoded)) {
                            tsNitrogen   = Math.floor(encoded / 10000);
                            tsPhosphorus = Math.floor(encoded / 100) % 100;
                            tsPotassium  = encoded % 100;
                            break; // got live NPK, stop
                        }
                    }
                }
            } catch (err) {
                console.error("ThingSpeak fetch failed for insights:", err.message);
            }
        }

        // 5. Aggregate final payload
        const inputData = {
            nitrogen: tsNitrogen,
            phosphorus: tsPhosphorus,
            potassium: tsPotassium,
            ph: profileData?.ph || 6,
            rainfall: profileData?.rainfall || 600,
            temperature: tsTemperature,
            district_name: profileData?.location || "Kolhapur",
            soil_color: profileData?.soilColor || profileData?.soilType || "Dark Brown"
        };

        // 6. Connect to Machine Learning prediction endpoint
        let recommendedCrop = "Wheat"; // Fallback
        try {
            // Hard timeout avoids stalling if the free-tier service goes dead
            const mlRes = await axios.post("https://predictcrop.onrender.com/predict-crop", inputData, { timeout: 8000 });
            if (mlRes.data && mlRes.data.recommended_crop) {
                recommendedCrop = mlRes.data.recommended_crop;
            }
        } catch (err) {
            console.warn("ML Endpoint failed, falling back to static", err.message);
        }

        // 7. Generate Insights using Google Gemini
        let aiInsights = "";
        if (MOCK_GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(MOCK_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `Based on the following agricultural data:
            ${JSON.stringify(inputData)}
            
            Recommended crop: ${recommendedCrop}
            
            Generate a concise, professional report containing exactly these sections with "### " markdown headers:
            ### Reason why this crop is suitable
            ### Soil condition analysis
            ### Weather suitability
            ### Farming tips (use bullet points)
            ### Risks and precautions (use bullet points)
            
            Do not include any other markdown formatting like bold text for headings. Just use the specified ### headings.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                aiInsights = response.text();
            } catch (err) {
                console.error("Gemini Failure:", err.message);
                aiInsights = getMockInsights(recommendedCrop, inputData);
            }
        } else {
            aiInsights = getMockInsights(recommendedCrop, inputData);
        }

        // 8. Commit strictly to MongoDB Cache!
        const newInsight = await CropInsight.create({
            userId,
            inputData,
            recommendedCrop,
            aiInsights
        });

        res.json({ success: true, data: newInsight });
    } catch (error) {
        next(error);
    }
};

const getMockInsights = (crop, data) => {
    return `### 🌾 Why ${crop}?
With a recorded temperature of ${data.temperature}°C in ${data.district_name}, this crop matches perfectly with the environmental and ${data.soil_color} soil baselines. Nitrogen levels are ideal.

### 🧪 Soil Analysis
Your NPK ratio rests near baseline thresholds. We recommend turning the soil lightly before initial seeding to combat compression.

### 🌧️ Weather Suitability
Kolhapur typically experiences balanced rainfall in this quadrant. Ensure proper drainage fields are mapped if unexpected downpours occur.

### 🚜 Farming Tips
- Ensure your ESP32 IoT system remains on "Auto" to map moisture trends.
- Use localized organic fertilizer.

### ⚠️ Risks
Excessive heat evaporation bounds are present. Check your Dashboard alerts regularly!`;
}

const getInsights = async (req, res, next) => {
    // Legacy fallback endpoint used by Dashboard if ThingSpeak fails
    res.json({
        success: true,
        data: {
            soilMoistureStatus: "Analyzing soil moisture trends...",
            irrigationRecommendation: "Evaluate current irrigation schedule thresholds.",
            generatedAt: new Date().toISOString()
        }
    });
};

const generateFertilizerInsights = async (req, res, next) => {
    try {
        const { profileData, forceRegenerate = false } = req.body;
        const userId = req.user._id;

        // 1. Evaluate cache
        if (!forceRegenerate) {
            const cached = await FertilizerInsight.findOne({ userId });
            if (cached) {
                return res.json({ success: true, data: cached });
            }
        }

        // 2. Clear old cache if regenerating
        await FertilizerInsight.deleteOne({ userId });

        // 3. Acquire User and API keys
        const user = await User.findById(userId).select('thingSpeakApiKey');

        // 4. Extract data from ThingSpeak securely (if key available)
        let tsTemperature = 25;
        let tsRainfall = 900;
        let tsNitrogen = profileData?.nitrogen || 80;
        let tsPhosphorus = profileData?.phosphorus || 40;
        let tsPotassium = profileData?.potassium || 50;

        if (user && user.thingSpeakApiKey) {
            try {
                const tsUrl = `https://api.thingspeak.com/channels/3337913/feeds.json?results=60&api_key=${user.thingSpeakApiKey}`;
                const tsResponse = await axios.get(tsUrl);
                const feeds = tsResponse.data?.feeds || [];
                for (let i = feeds.length - 1; i >= 0; i--) {
                    const feed = feeds[i];
                    if (feed.field2) tsTemperature = parseFloat(feed.field2);
                    if (feed.field8) {
                        const encoded = parseInt(feed.field8, 10);
                        if (!isNaN(encoded)) {
                            tsNitrogen   = Math.floor(encoded / 10000);
                            tsPhosphorus = Math.floor(encoded / 100) % 100;
                            tsPotassium  = encoded % 100;
                            break;
                        }
                    }
                }
            } catch (err) {
                console.error("ThingSpeak fetch failed for fertilizer:", err.message);
            }
        }

        const inputData = {
            nitrogen: tsNitrogen,
            phosphorus: tsPhosphorus,
            potassium: tsPotassium,
            ph: profileData?.ph || 6.5,
            rainfall: profileData?.rainfall || tsRainfall,
            temperature: tsTemperature,
            crop: profileData?.cropType || "wheat",
            district_name: profileData?.location || "Pune",
            soil_color: profileData?.soilColor || profileData?.soilType || "black"
        };

        if (!inputData.crop || inputData.crop.trim() === '') {
            return res.status(400).json({ success: false, message: "Unable to generate fertilizer recommendation. Please check crop details." });
        }

        // 6. Connect to Machine Learning prediction endpoint
        let recommendedFertilizer = "Urea"; // Fallback
        try {
            // Mapping explicitly to user's targeted endpoint
            const mlRes = await axios.post("https://predictcrop.onrender.com/predict-fertilizer", inputData, { timeout: 8000 });
            if (mlRes.data && mlRes.data.recommended_fertilizer) {
                recommendedFertilizer = mlRes.data.recommended_fertilizer;
            }
        } catch (err) {
            console.warn("Fertilizer ML Endpoint failed, falling back to static", err.message);
        }

        // 7. Generate Insights using Google Gemini
        let aiInsights = "";
        if (MOCK_GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(MOCK_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const prompt = `Based on the following agricultural data:
            ${JSON.stringify(inputData)}
            
            Recommended fertilizer: ${recommendedFertilizer}
            Target crop: ${inputData.crop}
            
            Generate a concise, professional report containing exactly these sections with "### " markdown headers:
            ### Why this fertilizer
            ### Soil improvement explanation
            ### Application strategy
            ### Precautions (use bullet points)
            
            Do not include any other markdown formatting like bold text for headings. Just use the specified ### headings.`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                aiInsights = response.text();
            } catch (err) {
                console.error("Gemini Failure:", err.message);
                aiInsights = getMockFertilizerInsights(recommendedFertilizer, inputData);
            }
        } else {
            aiInsights = getMockFertilizerInsights(recommendedFertilizer, inputData);
        }

        // 8. Commit strictly to MongoDB Cache!
        const newInsight = await FertilizerInsight.create({
            userId,
            inputData,
            recommendedFertilizer,
            aiInsights
        });

        res.json({ success: true, data: newInsight });
    } catch (error) {
        next(error);
    }
};

const getMockFertilizerInsights = (fert, data) => {
    return `### Why this fertilizer
${fert} aggressively provides the necessary nutrient spikes to sustain ${data.crop} fields structurally against ${data.soil_color} soils specifically around current temperature bounds.

### Soil improvement explanation
It efficiently boosts baseline Nitrogen indices while preserving neutral pH levels, averting structural burn hazards inherent with synthetic mixes.

### Application strategy
- Apply evenly pre-plant directly into the topsoil.
- Utilize mid-season side-dressing if structural deficiencies manifest.

### Precautions
- Avoid excessive dumping which limits groundwater purity.
- Mitigate application right before heavy rain to deter severe surface running.`;
}

const generateIrrigationInsights = async (req, res, next) => {
    try {
        const { profileData, forceRegenerate = false } = req.body;
        const userId = req.user._id;

        // 1. Check cache
        if (!forceRegenerate) {
            const cached = await IrrigationInsight.findOne({ userId });
            if (cached) return res.json({ success: true, data: cached });
        }

        // 2. Clear old cache
        await IrrigationInsight.deleteOne({ userId });

        // 3. Get ThingSpeak live data
        const user = await User.findById(userId).select('thingSpeakApiKey');
        let tsTemperature = 25, tsHumidity = 60, tsSoilMoisture = 40, tsSoilTemp = 22;

        if (user?.thingSpeakApiKey) {
            try {
                // Fetch 60 results — motor-command rows have no sensor data, scan backwards
                const tsUrl = `https://api.thingspeak.com/channels/3337913/feeds.json?results=60&api_key=${user.thingSpeakApiKey}`;
                const tsRes = await axios.get(tsUrl);
                const feeds = tsRes.data.feeds || [];
                for (let i = feeds.length - 1; i >= 0; i--) {
                    const feed = feeds[i];
                    if (feed.field1 != null || feed.field2 != null) {
                        // field1=moisture(ADC 0-4095), field2=temp, field3=humidity, field4=soilTemp, field5=LDR
                        if (feed.field1) tsSoilMoisture = Math.max(0, Math.min(100, Math.round(((4095 - parseFloat(feed.field1)) / 4095) * 100)));
                        if (feed.field2) tsTemperature  = parseFloat(feed.field2);
                        if (feed.field3) tsHumidity     = parseFloat(feed.field3);
                        if (feed.field4) tsSoilTemp     = parseFloat(feed.field4); // field4=Dallas soil temp (NOT field5)
                        break;
                    }
                }
            } catch (err) {
                console.error("ThingSpeak fetch failed for irrigation:", err.message);
            }
        }

        const inputData = {
            district_name: profileData?.location || "Pune",
            soil_color: profileData?.soilColor || profileData?.soilType || "black",
            crop: profileData?.cropType || "wheat",
            rainfall: profileData?.rainfall || 800,
            temperature: tsTemperature,
            humidity: tsHumidity,
            soil_moisture: tsSoilMoisture,
            soil_temperature: tsSoilTemp,
        };

        // 4. Determine irrigation need based on live soil moisture
        // Rule: 0-30% = DRY → Irrigate Now | 30-100% = OK → No Irrigation Needed
        // ML endpoint is called for logging but soil moisture is the source of truth
        let irrigationNeeded = tsSoilMoisture < 30;
        try {
            await axios.post("https://predictcrop.onrender.com/predict-irrigation", inputData, { timeout: 8000 });
            // Ignoring ML result — soil moisture threshold is authoritative
        } catch (err) {
            console.log("Irrigation ML endpoint unavailable, using soil moisture rule:", err.message);
        }
        console.log(`[IRRIGATION] Soil moisture: ${tsSoilMoisture}% → ${irrigationNeeded ? 'IRRIGATE NOW' : 'No irrigation needed'}`);

        // 5. Gemini 2.0 Flash AI insights
        let aiInsights = "";
        if (MOCK_GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(MOCK_GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
                const decision = irrigationNeeded ? "IRRIGATION REQUIRED" : "NO IRRIGATION NEEDED";
                const prompt = `Expert agronomist AI. Farm data: ${JSON.stringify(inputData)}. ML Decision: ${decision}.

Write a SHORT irrigation advisory (max 2 sentences per section, 3 bullets max) using these ### headers only:
### Current Field Assessment
### Why ${irrigationNeeded ? 'Irrigation is Needed' : 'No Irrigation is Needed'}
### Recommended Action
### Water Management Tips (- bullets)
### Precautions (- bullets)

Crop: ${inputData.crop}, Soil: ${inputData.soil_color}, District: ${inputData.district_name}. Plain text only, no bold headers.`;

                const result = await model.generateContent(prompt);
                aiInsights = result.response.text();
            } catch (err) {
                console.error("Gemini 2.0 Flash Error:", err.message);
                aiInsights = getMockIrrigationInsights(irrigationNeeded, inputData);
            }
        } else {
            aiInsights = getMockIrrigationInsights(irrigationNeeded, inputData);
        }

        // 6. Cache and return
        const newInsight = await IrrigationInsight.create({
            userId, inputData, irrigationNeeded, aiInsights
        });

        res.json({ success: true, data: newInsight });
    } catch (error) {
        next(error);
    }
};

const getMockIrrigationInsights = (irrigationNeeded, data) => {
    if (irrigationNeeded) {
        return `### Current Field Assessment
Soil moisture at ${data.soil_moisture}% is critically below the threshold for healthy ${data.crop} growth in ${data.district_name}.

### Why Irrigation is Needed
With a soil moisture reading of ${data.soil_moisture}% and temperature at ${data.temperature}°C, evapotranspiration rates are exceeding current soil water availability. The ${data.soil_color} soil type requires supplemental irrigation to prevent crop stress.

### Recommended Action
Activate your irrigation system immediately. Apply water at root zone level and monitor moisture levels using your ESP32 sensor.

### Water Management Tips
- Schedule irrigation during early morning (5–7 AM) to minimize evaporation loss.
- Apply 25–30mm of water per session for ${data.crop}.
- Switch motor to AUTO mode to respond to real-time soil moisture.

### Precautions
- Avoid over-watering; keep soil moisture below 75% to prevent root rot.
- Monitor rainfall forecasts before scheduling manual irrigation.`;
    } else {
        return `### Current Field Assessment
Soil moisture at ${data.soil_moisture}% is within optimal range for ${data.crop} in ${data.district_name}. No immediate irrigation required.

### Why No Irrigation is Needed
Current conditions — soil moisture ${data.soil_moisture}%, temperature ${data.temperature}°C, humidity ${data.humidity}% — indicate adequate water availability in the root zone.

### Recommended Action
Maintain current irrigation schedule. Continue monitoring with your IoT sensor system.

### Water Management Tips
- Keep the motor in AUTO mode for optimal resource efficiency.
- Re-evaluate if temperature rises above 35°C or moisture drops below 35%.
- Check soil moisture every 4–6 hours via your dashboard.

### Precautions
- Do not irrigate when rainfall is forecast within 24 hours.
- Excessive moisture can lead to fungal growth in ${data.crop}.`;
    }
};

module.exports = { generateCropInsights, generateFertilizerInsights, generateIrrigationInsights, getInsights };

