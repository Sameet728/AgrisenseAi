import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import i18n from '../services/i18n';
import { t } from '../services/i18n';
import { translateToMarathi } from '../services/translate';

// ─── Helper: translate only if Marathi is active ─────────────────────────────
const tx = async (text) => {
  if (!text || i18n.locale !== 'mr') return text || '';
  return translateToMarathi(text);
};

// ─── Helper: translate each section header inside the AI markdown ─────────────
const translateMarkdownHeaders = async (text) => {
  if (!text || i18n.locale !== 'mr') return text || '';
  // Replace each ### header with translated version
  const headerRegex = /### (.+)/g;
  const matches = [...text.matchAll(headerRegex)];
  let result = text;
  for (const match of matches) {
    const translated = await translateToMarathi(match[1]);
    result = result.replace(match[0], `### ${translated}`);
  }
  return result;
};

// ─── Helper: translate each bullet point line ─────────────────────────────────
const translateBullets = async (text) => {
  if (!text || i18n.locale !== 'mr') return text || '';
  const bulletRegex = /^- (.+)$/gm;
  const matches = [...text.matchAll(bulletRegex)];
  let result = text;
  for (const match of matches) {
    const translated = await translateToMarathi(match[1]);
    result = result.replace(match[0], `- ${translated}`);
  }
  return result;
};

// ─── Helper: translate paragraph bodies (non-header non-bullet lines) ──────────
const translateParagraphs = async (text) => {
  if (!text || i18n.locale !== 'mr') return text || '';
  const lines = text.split('\n');
  const translated = await Promise.all(lines.map(async (line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('###') || trimmed.startsWith('-')) return line;
    return translateToMarathi(line);
  }));
  return translated.join('\n');
};

// ─── Fully translate AI markdown (headers + bullets + paragraphs) ─────────────
const translateFullAI = async (text) => {
  if (!text || i18n.locale !== 'mr') return text || '';
  let result = text;
  result = await translateMarkdownHeaders(result);
  result = await translateBullets(result);
  result = await translateParagraphs(result);
  return result;
};

// ─── Convert (already translated) markdown to premium HTML ───────────────────
const formatMarkdownToPremiumHTML = (text, accentColor = '#38A169', tipBg = '#F0FFF4', tipColor = '#22543D', tipBorder = '#48BB78') => {
  if (!text) return '';
  let html = text.replace(/\*\*(.*?)\*\*/g, '<span style="color: #2D3748; font-weight: 800;">$1</span>');
  html = html.replace(/### (.*?)\n/g, `
    </div>
    <div class="insight-section">
      <div class="insight-header">
        <span class="insight-icon">■</span>
        <h3>$1</h3>
      </div>
  `);
  html = html.replace(/- (.*?)\n/g, `
    <div class="tip-card" style="background:${tipBg};color:${tipColor};border-left:3px solid ${tipBorder};">
      <span style="color:${accentColor};margin-right:8px;">✔</span> $1
    </div>
  `);
  html = html.replace(/\n\n/g, '<br/>');
  if (html.startsWith('</div>')) {
    html = html.replace('</div>', '');
  }
  return html;
};

// ─── Shared label helpers ─────────────────────────────────────────────────────
const label = {
  farmer: () => i18n.locale === 'mr' ? 'शेतकरी' : 'Farmer',
  date: () => i18n.locale === 'mr' ? 'तारीख' : 'Date',
  region: () => i18n.locale === 'mr' ? 'प्रदेश' : 'Region',
  targetCrop: () => i18n.locale === 'mr' ? 'लक्ष्य पीक' : 'Target Crop',
  nitrogen: () => i18n.locale === 'mr' ? 'नायट्रोजन' : 'Nitrogen',
  phosphorus: () => i18n.locale === 'mr' ? 'फॉस्फरस' : 'Phosphorus',
  potassium: () => i18n.locale === 'mr' ? 'पोटॅशियम' : 'Potassium',
  soilPh: () => i18n.locale === 'mr' ? 'मातीचा pH' : 'Soil pH',
  soilColor: () => i18n.locale === 'mr' ? 'मातीचा रंग' : 'Soil Color',
  rainfall: () => i18n.locale === 'mr' ? 'पाऊस' : 'Rainfall',
  temperature: () => i18n.locale === 'mr' ? 'तापमान' : 'Temperature',
  telemetry: () => i18n.locale === 'mr' ? 'टेलिमेट्री व माहिती' : 'Telemetry & Input Data',
  aiAnalysis: () => i18n.locale === 'mr' ? 'AI विश्लेषण' : 'Generative AI Analysis',
  footer: () => i18n.locale === 'mr' ? 'AgriSense AI द्वारे सुरक्षितपणे तयार केले.' : 'Generated securely by the AgriSense AI IoT Engine.',
  geminiNote: () => i18n.locale === 'mr' ? 'Gemini Cloud वापरून तयार केले.' : 'Confidentially mapped via Gemini Cloud.',
  aiCrop: () => i18n.locale === 'mr' ? 'शिफारस केलेले पीक' : ' Recommended Crop',
  aiFert: () => i18n.locale === 'mr' ? 'शिफारस केलेले खत' : 'Recommended Fertilizer',
  cropReport: () => i18n.locale === 'mr' ? 'पीक बुद्धिमत्ता अहवाल' : 'Crop Intelligence Report',
  fertReport: () => i18n.locale === 'mr' ? 'खत बुद्धिमत्ता अहवाल' : 'Fertilizer Intelligence Report',
  soilBounds: () => i18n.locale === 'mr' ? 'टेलिमेट्री व प्रारंभिक मातीमाप' : 'Telemetry & Initial Soil Bounds',
};

// ─── Shared CSS ───────────────────────────────────────────────────────────────
const baseCSS = (accentColor) => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
  body{font-family:'Inter',sans-serif;color:#4A5568;padding:40px 50px;line-height:1.6;background:#fff;margin:0}
  .report-header{border-bottom:2px solid #E2E8F0;padding-bottom:20px;margin-bottom:30px;display:flex;justify-content:space-between;align-items:flex-end}
  .brand-title{color:${accentColor};font-size:28px;font-weight:800;margin:0;letter-spacing:-0.5px}
  .brand-subtitle{color:#718096;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-top:4px;font-weight:600}
  .meta-text{text-align:right;font-size:13px;color:#A0AEC0}
  .hero-box{background:linear-gradient(135deg,${accentColor} 0%,${accentColor}CC 100%);border-radius:12px;padding:30px;color:#fff;text-align:center;box-shadow:0 4px 15px ${accentColor}33;margin-bottom:40px}
  .hero-label{font-size:13px;text-transform:uppercase;letter-spacing:2px;opacity:.9;margin-bottom:10px;font-weight:600}
  .hero-value{font-size:36px;font-weight:800;margin:0;letter-spacing:-1px}
  .section-title{font-size:16px;font-weight:800;color:#1A202C;text-transform:uppercase;letter-spacing:1px;margin-bottom:20px;border-left:4px solid ${accentColor};padding-left:12px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:40px}
  .grid-card{background:#F7FAFC;padding:15px;border-radius:8px;border:1px solid #EDF2F7}
  .grid-label{font-size:11px;color:#718096;text-transform:uppercase;font-weight:800;margin-bottom:4px}
  .grid-value{font-size:18px;font-weight:800;color:#2D3748}
  .unit{font-size:12px;font-weight:600;color:#A0AEC0}
  .insight-section{background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:25px;margin-bottom:20px}
  .insight-header{display:flex;align-items:center;margin-bottom:15px;border-bottom:1px solid #EDF2F7;padding-bottom:10px}
  .insight-icon{color:${accentColor};font-size:18px;margin-right:10px}
  .insight-header h3{margin:0;color:#2D3748;font-size:18px}
  .tip-card{padding:12px 15px;border-radius:6px;margin-bottom:8px;font-size:14px}
  .footer{margin-top:60px;padding-top:20px;border-top:1px solid #E2E8F0;text-align:center;font-size:12px;color:#A0AEC0}
`;

// ═══════════════════════════════════════════════════════════════════════════════
// CROP REPORT PDF
// ═══════════════════════════════════════════════════════════════════════════════
export const generateCropReportPDF = async (reportData, userName) => {
  const { recommendedCrop, aiInsights, inputData, generatedAt } = reportData;
  const targetDate = new Date(generatedAt || Date.now()).toLocaleDateString();

  // Translate entire AI text block
  const translatedAI = await translateFullAI(aiInsights);
  const formattedInsights = formatMarkdownToPremiumHTML(translatedAI, '#38A169', '#F0FFF4', '#22543D', '#48BB78');

  const reportId = `AS-${Math.floor(Math.random() * 1000000)}`;

  const htmlContent = `<!DOCTYPE html>
  <html lang="${i18n.locale}">
  <head>
    <meta charset="UTF-8">
    <title>AgriSense ${label.cropReport()}</title>
    <style>${baseCSS('#276749')}</style>
  </head>
  <body>
    <div class="report-header">
      <div>
        <h1 class="brand-title">AgriSense AI</h1>
        <div class="brand-subtitle">${label.cropReport()}</div>
      </div>
      <div class="meta-text">
        <strong>${label.farmer()}:</strong> ${userName || 'Farmer'}<br/>
        <strong>${label.date()}:</strong> ${targetDate}<br/>
        <strong>${label.region()}:</strong> <span style="text-transform:capitalize">${inputData?.district_name || 'N/A'}</span>
      </div>
    </div>

    <div class="hero-box">
      <div class="hero-label">${label.aiCrop()}</div>
      <h2 class="hero-value">${recommendedCrop}</h2>
    </div>

    <div class="section-title">${label.telemetry()}</div>
    <div class="grid">
      <div class="grid-card"><div class="grid-label">${label.nitrogen()}</div><div class="grid-value">${inputData?.nitrogen || '--'} <span class="unit">mg/kg</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.phosphorus()}</div><div class="grid-value">${inputData?.phosphorus || '--'} <span class="unit">mg/kg</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.potassium()}</div><div class="grid-value">${inputData?.potassium || '--'} <span class="unit">mg/kg</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.soilPh()}</div><div class="grid-value">${inputData?.ph || '--'}</div></div>
      <div class="grid-card"><div class="grid-label">${label.soilColor()}</div><div class="grid-value" style="text-transform:capitalize">${inputData?.soil_color || '--'}</div></div>
      <div class="grid-card"><div class="grid-label">${label.rainfall()}</div><div class="grid-value">${inputData?.rainfall || '--'} <span class="unit">mm</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.temperature()}</div><div class="grid-value">${inputData?.temperature || '--'} <span class="unit">°C</span></div></div>
    </div>

    <div class="section-title">${label.aiAnalysis()}</div>
    <div style="font-size:15px;color:#4A5568;">
      ${formattedInsights}
    </div>

    <div class="footer">
      ${label.footer()}<br/>
      Report ID: ${reportId} | ${label.geminiNote()}
    </div>
  </body>
  </html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download AgriSense Report' });
  } catch (error) {
    console.error("Crop PDF Engine Failed:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// FERTILIZER REPORT PDF
// ═══════════════════════════════════════════════════════════════════════════════
export const generateFertilizerReportPDF = async (reportData, userName) => {
  const { recommendedFertilizer, aiInsights, inputData, generatedAt } = reportData;
  const targetDate = new Date(generatedAt || Date.now()).toLocaleDateString();

  // Translate entire AI text block
  const translatedAI = await translateFullAI(aiInsights);
  const formattedInsights = formatMarkdownToPremiumHTML(translatedAI, '#319795', '#E6FFFA', '#2C7A7B', '#38B2AC');

  const reportId = `ASF-${Math.floor(Math.random() * 1000000)}`;

  const htmlContent = `<!DOCTYPE html>
  <html lang="${i18n.locale}">
  <head>
    <meta charset="UTF-8">
    <title>AgriSense ${label.fertReport()}</title>
    <style>${baseCSS('#285E61')}</style>
  </head>
  <body>
    <div class="report-header">
      <div>
        <h1 class="brand-title">AgriSense AI</h1>
        <div class="brand-subtitle">${label.fertReport()}</div>
      </div>
      <div class="meta-text">
        <strong>${label.farmer()}:</strong> ${userName || 'Farmer'}<br/>
        <strong>${label.date()}:</strong> ${targetDate}<br/>
        <strong>${label.targetCrop()}:</strong> <span style="text-transform:capitalize">${inputData?.crop || 'N/A'}</span>
      </div>
    </div>

    <div class="hero-box">
      <div class="hero-label">${label.aiFert()}</div>
      <h2 class="hero-value">${recommendedFertilizer}</h2>
    </div>

    <div class="section-title">${label.soilBounds()}</div>
    <div class="grid">
      <div class="grid-card"><div class="grid-label">${label.nitrogen()}</div><div class="grid-value">${inputData?.nitrogen || '--'} <span class="unit">mg/kg</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.phosphorus()}</div><div class="grid-value">${inputData?.phosphorus || '--'} <span class="unit">mg/kg</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.potassium()}</div><div class="grid-value">${inputData?.potassium || '--'} <span class="unit">mg/kg</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.soilPh()}</div><div class="grid-value">${inputData?.ph || '--'}</div></div>
      <div class="grid-card"><div class="grid-label">${label.targetCrop()}</div><div class="grid-value" style="text-transform:capitalize">${inputData?.crop || '--'}</div></div>
      <div class="grid-card"><div class="grid-label">${label.rainfall()}</div><div class="grid-value">${inputData?.rainfall || '--'} <span class="unit">mm</span></div></div>
      <div class="grid-card"><div class="grid-label">${label.temperature()}</div><div class="grid-value">${inputData?.temperature || '--'} <span class="unit">°C</span></div></div>
    </div>

    <div class="section-title">${label.aiAnalysis()}</div>
    <div style="font-size:15px;color:#4A5568;">
      ${formattedInsights}
    </div>

    <div class="footer">
      ${label.footer()}<br/>
      Report ID: ${reportId} | ${label.geminiNote()}
    </div>
  </body>
  </html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download AgriSense Fertilizer Report' });
  } catch (error) {
    console.error("Fertilizer PDF Engine Failed:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// IRRIGATION ADVISORY PDF
// ═══════════════════════════════════════════════════════════════════════════════
export const generateIrrigationReportPDF = async (reportData, userName) => {
  const { irrigationNeeded, aiInsights, inputData, updatedAt } = reportData;
  const needed = irrigationNeeded === true || irrigationNeeded === 1;
  const accentHex = needed ? '#C05621' : '#276749';
  const targetDate = new Date(updatedAt || Date.now()).toLocaleDateString();

  // Translate AI text block
  const translatedAI = await translateFullAI(aiInsights);
  const formattedInsights = formatMarkdownToPremiumHTML(
    translatedAI,
    accentHex,
    needed ? '#FFFAF0' : '#F0FFF4',
    needed ? '#7B341E' : '#22543D',
    needed ? '#F6AD55' : '#48BB78'
  );

  const reportId = `ASI-${Math.floor(Math.random() * 1000000)}`;
  const decisionLbl = i18n.locale === 'mr'
    ? (needed ? 'सिंचन आवश्यक' : 'सिंचन नको')
    : (needed ? 'Irrigation Required' : 'No Irrigation Needed');
  const badgeLbl = i18n.locale === 'mr' ? 'सिंचन अंदाज' : 'IRRIGATION PREDICTION';
  const fieldTitle = i18n.locale === 'mr' ? 'शेताची माहिती' : 'Field Data';
  const soilMoistLbl = i18n.locale === 'mr' ? 'मातीतील ओलावा' : 'Soil Moisture';
  const soilTempLbl = i18n.locale === 'mr' ? 'मातीचे तापमान' : 'Soil Temp';
  const tempLbl = i18n.locale === 'mr' ? 'तापमान' : 'Temperature';
  const humLbl = i18n.locale === 'mr' ? 'आर्द्रता' : 'Humidity';
  const rainLbl = i18n.locale === 'mr' ? 'पाऊस' : 'Rainfall';
  const cropLbl = i18n.locale === 'mr' ? 'पीक' : 'Crop';
  const farmerLbl = label.farmer();
  const dateLbl = label.date();
  const aiLbl = label.aiAnalysis();
  const footerLbl = label.footer();
  const geminiLbl = label.geminiNote();
  const irrigReport = i18n.locale === 'mr' ? 'सिंचन सल्ला अहवाल' : 'Irrigation Advisory Report';

  const htmlContent = `<!DOCTYPE html>
  <html lang="${i18n.locale}">
  <head>
    <meta charset="UTF-8">
    <title>AgriSense ${irrigReport}</title>
    <style>${baseCSS(accentHex)}</style>
  </head>
  <body>
    <div class="report-header">
      <div>
        <h1 class="brand-title">AgriSense AI</h1>
        <div class="brand-subtitle">${irrigReport}</div>
      </div>
      <div class="meta-text">
        <strong>${farmerLbl}:</strong> ${userName || 'Farmer'}<br/>
        <strong>${dateLbl}:</strong> ${targetDate}<br/>
        <strong>${cropLbl}:</strong> <span style="text-transform:capitalize">${inputData?.crop || 'N/A'}</span>
      </div>
    </div>

    <div class="hero-box">
      <div class="hero-label">${badgeLbl}</div>
      <h2 class="hero-value">${decisionLbl}</h2>
    </div>

    <div class="section-title">${fieldTitle}</div>
    <div class="grid">
      <div class="grid-card"><div class="grid-label">${soilMoistLbl}</div><div class="grid-value">${inputData?.soil_moisture ?? '--'} <span class="unit">%</span></div></div>
      <div class="grid-card"><div class="grid-label">${soilTempLbl}</div><div class="grid-value">${inputData?.soil_temperature ?? '--'} <span class="unit">°C</span></div></div>
      <div class="grid-card"><div class="grid-label">${tempLbl}</div><div class="grid-value">${inputData?.temperature ?? '--'} <span class="unit">°C</span></div></div>
      <div class="grid-card"><div class="grid-label">${humLbl}</div><div class="grid-value">${inputData?.humidity ?? '--'} <span class="unit">%</span></div></div>
      <div class="grid-card"><div class="grid-label">${rainLbl}</div><div class="grid-value">${inputData?.rainfall ?? '--'} <span class="unit">mm</span></div></div>
      <div class="grid-card"><div class="grid-label">${cropLbl}</div><div class="grid-value" style="text-transform:capitalize">${inputData?.crop ?? '--'}</div></div>
    </div>

    <div class="section-title">${aiLbl}</div>
    <div style="font-size:15px;color:#4A5568;">
      ${formattedInsights}
    </div>

    <div class="footer">
      ${footerLbl}<br/>
      Report ID: ${reportId} | ${geminiLbl}
    </div>
  </body>
  </html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download AgriSense Irrigation Report' });
  } catch (error) {
    console.error("Irrigation PDF Engine Failed:", error);
    throw error;
  }
};

