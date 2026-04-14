import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { t } from '../services/i18n';
import i18n from '../services/i18n';
import { translateToMarathi } from '../services/translate';

/** Translate text only if current language is Marathi */
const tx = async (text) => {
  if (!text || i18n.locale !== 'mr') return text;
  return translateToMarathi(text);
};

// ─── Analytics PDF (sensor history) ─────────────────────────────────────────
export const downloadPDF = async (data, dateRangeLabel, profileData) => {
  try {
    const user     = profileData?.name     || t("dashboard.greeting");
    const crop     = profileData?.cropType || "N/A";
    const farmSize = profileData?.farmSize || "N/A";

    if (!data || data.length === 0) throw new Error("No data available to generate report.");

    let sumMoisture = 0, sumTemp = 0, sumHum = 0, minTemp = 999, maxTemp = -999;
    data.forEach(d => {
      sumMoisture += d.soil; sumTemp += d.temperature; sumHum += d.humidity;
      if (d.temperature > maxTemp) maxTemp = d.temperature;
      if (d.temperature < minTemp) minTemp = d.temperature;
    });
    const count       = data.length;
    const avgMoisture = (sumMoisture / count).toFixed(1);
    const avgTemp     = (sumTemp     / count).toFixed(1);
    const avgHum      = (sumHum      / count).toFixed(1);

    const motorOn  = t("motor.on");
    const motorOff = t("motor.off");
    const rows = data.map(d => `
      <tr>
        <td>${new Date(d.timestamp).toLocaleString()}</td>
        <td>${Math.round(d.soil)}%</td>
        <td>${d.temperature.toFixed(1)}\u00b0C</td>
        <td>${d.humidity.toFixed(1)}%</td>
        <td>${d.light}%</td>
        <td>${d.soilTemp.toFixed(1)}\u00b0C</td>
        <td>${d.motor === 'ON' ? motorOn : motorOff} (${d.mode})</td>
      </tr>`).join('');

    const html = `<html><head><meta charset="utf-8"/><style>
      body{font-family:'Helvetica Neue',Arial,sans-serif;color:#333;margin:40px}
      .header{text-align:center;border-bottom:3px solid #1A6B3C;padding-bottom:20px;margin-bottom:30px}
      .header h1{color:#1A6B3C;margin:0;font-size:28px} .header p{color:#666;font-size:14px}
      .section{margin-bottom:30px} .section-title{font-size:18px;color:#1A6B3C;border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:15px}
      .metrics-grid{display:flex;justify-content:space-between;margin-bottom:20px}
      .metric-box{background:#f4fbf7;padding:15px;border-radius:8px;width:30%;border-left:4px solid #1A6B3C}
      .metric-title{font-size:12px;color:#666;text-transform:uppercase;font-weight:bold}
      .metric-value{font-size:24px;color:#1A6B3C;font-weight:bold;margin-top:5px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#1A6B3C;color:#fff;padding:10px;text-align:left}
      td{padding:10px;border-bottom:1px solid #ddd} tr:nth-child(even){background:#f9f9f9}
      .footer{margin-top:50px;text-align:center;color:#999;font-size:12px;border-top:1px solid #eee;padding-top:20px}
    </style></head><body>
      <div class="header"><h1>${t("pdf.title")}</h1><p>${t("pdf.generated")} ${user} | ${dateRangeLabel}</p></div>
      <div class="section"><div class="section-title">${t("pdf.overview")}</div>
        <p><strong>${t("pdf.crop")}:</strong> ${crop} &nbsp;|&nbsp; <strong>${t("pdf.size")}:</strong> ${farmSize} Acres</p></div>
      <div class="section"><div class="section-title">${t("pdf.stats")}</div>
        <div class="metrics-grid">
          <div class="metric-box"><div class="metric-title">${t("pdf.avg_moist")}</div><div class="metric-value">${avgMoisture}%</div></div>
          <div class="metric-box"><div class="metric-title">${t("pdf.avg_temp")}</div><div class="metric-value">${avgTemp}\u00b0C</div>
            <div style="font-size:10px;color:#777">Min:${minTemp}\u00b0C | Max:${maxTemp}\u00b0C</div></div>
          <div class="metric-box"><div class="metric-title">${t("pdf.avg_hum")}</div><div class="metric-value">${avgHum}%</div></div>
        </div></div>
      <div class="section"><div class="section-title">${t("pdf.log")}</div>
        <table><thead><tr>
          <th>${t("pdf.col_time")}</th><th>${t("pdf.col_moist")}</th><th>${t("pdf.col_temp")}</th>
          <th>${t("pdf.col_hum")}</th><th>${t("pdf.col_light")}</th><th>${t("pdf.col_s_temp")}</th><th>${t("pdf.col_motor")}</th>
        </tr></thead><tbody>${rows}</tbody></table></div>
      <div class="footer">${t("pdf.footer")} ${new Date().toLocaleString()}</div>
    </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error("PDF generation failed", error);
    throw new Error("Unable to download PDF. Please try again.");
  }
};

// ─── Crop Intelligence PDF ────────────────────────────────────────────────────
export const generateCropReportPDF = async (reportData, farmerName) => {
  try {
    const crop    = reportData.recommendedCrop || "N/A";
    const inputs  = reportData.inputData       || {};
    const genDate = reportData.updatedAt
      ? new Date(reportData.updatedAt).toLocaleString()
      : new Date().toLocaleString();

    // Parse AI insights into sections
    const rawText  = reportData.aiInsights || "";
    const sections = rawText.split(/###\s+/);
    let reasonRaw = "", soilRaw = "", weatherRaw = "", tipsRaw = "", risksRaw = "";
    sections.forEach(sec => {
      if (!sec.trim()) return;
      const [titleLine, ...bodyLines] = sec.split('\n');
      const title = titleLine.toLowerCase();
      const body  = bodyLines.join('\n').trim();
      if (title.includes('why') || title.includes('reason'))              reasonRaw  = body;
      else if (title.includes('soil'))                                     soilRaw    = body;
      else if (title.includes('weather') || title.includes('suitability')) weatherRaw = body;
      else if (title.includes('tip') || title.includes('farm'))            tipsRaw    = body;
      else if (title.includes('risk') || title.includes('precaution'))     risksRaw   = body;
    });

    // Translate all sections in parallel (no-op if English)
    const [reason, soil, weather, tips, risks] = await Promise.all([
      tx(reasonRaw  || rawText.slice(0, 600)),
      tx(soilRaw),
      tx(weatherRaw),
      tx(tipsRaw),
      tx(risksRaw),
    ]);

    const buildSection = (label, body) => body ? `
      <div class="section">
        <div class="section-title">${label}</div>
        <p class="body-text">${body.replace(/\n/g, '<br>')}</p>
      </div>` : '';

    const html = `<html><head><meta charset="utf-8"/><style>
      body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a202c;margin:40px}
      h1{color:#1A6B3C;font-size:26px;margin-bottom:4px}
      .subtitle{color:#666;font-size:13px;margin-bottom:30px}
      .badge{display:inline-block;background:#f0fff4;color:#276749;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:20px}
      .crop-name{font-size:36px;font-weight:900;color:#1A6B3C;text-align:center;margin:10px 0}
      .section{margin:24px 0}
      .section-title{font-size:16px;font-weight:700;color:#1A6B3C;border-left:4px solid #1A6B3C;padding-left:10px;margin-bottom:10px}
      .body-text{font-size:13px;line-height:1.8;color:#4a5568}
      .data-grid{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}
      .data-cell{background:#f7fafc;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;border-top:3px solid #1A6B3C}
      .data-label{font-size:11px;color:#718096;text-transform:uppercase;font-weight:600}
      .data-value{font-size:18px;font-weight:700;color:#1A6B3C;margin-top:4px}
      .footer{margin-top:40px;border-top:1px solid #eee;padding-top:16px;text-align:center;color:#a0aec0;font-size:11px}
    </style></head><body>
      <div style="text-align:center;border-bottom:3px solid #1A6B3C;padding-bottom:20px;margin-bottom:24px">
        <h1>${t("crop.report_title")}</h1>
        <p class="subtitle">${t("pdf.generated")} ${farmerName || ''} | ${genDate}</p>
        <div class="badge">${t("crop.highly_suitable")}</div>
        <div class="crop-name">${crop}</div>
      </div>

      <div class="section">
        <div class="section-title">${t("crop.data_used")}</div>
        <div class="data-grid">
          <div class="data-cell"><div class="data-label">${t("crop.nitrogen")}</div><div class="data-value">${inputs.nitrogen || '--'} mg</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.phosphorus")}</div><div class="data-value">${inputs.phosphorus || '--'} mg</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.potassium")}</div><div class="data-value">${inputs.potassium || '--'} mg</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.soil_ph")}</div><div class="data-value">${inputs.ph || '--'}</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.soil_color")}</div><div class="data-value">${inputs.soil_color || '--'}</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.latest_temp")}</div><div class="data-value">${inputs.temperature || '--'}\u00b0C</div></div>
        </div>
      </div>

      ${buildSection(t("crop.why_recommended") + " \u2014 " + crop, reason)}
      ${buildSection(t("crop.soil_health"), soil)}
      ${buildSection(t("crop.weather_suit"), weather)}
      ${buildSection(t("crop.expert_tips"), tips)}
      ${buildSection(t("crop.risks"), risks)}

      <div class="footer">AgriSense AI &mdash; ${new Date().toLocaleString()}</div>
    </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (err) {
    console.error("Crop PDF failed", err);
    throw err;
  }
};

// ─── Fertilizer Recommendation PDF ───────────────────────────────────────────
export const generateFertilizerReportPDF = async (reportData, farmerName) => {
  try {
    const fert    = reportData.recommendedFertilizer || "N/A";
    const inputs  = reportData.inputData             || {};
    const genDate = reportData.updatedAt
      ? new Date(reportData.updatedAt).toLocaleString()
      : new Date().toLocaleString();

    // Parse AI insights into sections
    const rawText  = reportData.aiInsights || "";
    const sections = rawText.split(/###\s+/);
    let reasonRaw = "", soilRaw = "", strategyRaw = "", risksRaw = "";
    sections.forEach(sec => {
      if (!sec.trim()) return;
      const [titleLine, ...bodyLines] = sec.split('\n');
      const title = titleLine.toLowerCase();
      const body  = bodyLines.join('\n').trim();
      if (title.includes('why') || title.includes('reason'))              reasonRaw   = body;
      else if (title.includes('soil'))                                     soilRaw     = body;
      else if (title.includes('application') || title.includes('strategy')) strategyRaw = body;
      else if (title.includes('risk') || title.includes('precaution'))     risksRaw    = body;
    });

    // Translate all sections in parallel (no-op if English)
    const [reason, soil, strategy, risks] = await Promise.all([
      tx(reasonRaw  || rawText.slice(0, 600)),
      tx(soilRaw),
      tx(strategyRaw),
      tx(risksRaw),
    ]);

    const buildSection = (label, body) => body ? `
      <div class="section">
        <div class="section-title">${label}</div>
        <p class="body-text">${body.replace(/\n/g, '<br>')}</p>
      </div>` : '';

    const html = `<html><head><meta charset="utf-8"/><style>
      body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1a202c;margin:40px}
      h1{color:#2C7A7B;font-size:26px;margin-bottom:4px}
      .subtitle{color:#666;font-size:13px;margin-bottom:30px}
      .badge{display:inline-block;background:#E6FFFA;color:#2C7A7B;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:20px}
      .fert-name{font-size:36px;font-weight:900;color:#2C7A7B;text-align:center;margin:10px 0}
      .section{margin:24px 0}
      .section-title{font-size:16px;font-weight:700;color:#2C7A7B;border-left:4px solid #2C7A7B;padding-left:10px;margin-bottom:10px}
      .body-text{font-size:13px;line-height:1.8;color:#4a5568}
      .data-grid{display:flex;flex-wrap:wrap;gap:12px;margin-top:10px}
      .data-cell{background:#f7fafc;border-radius:8px;padding:12px 16px;flex:1;min-width:120px;border-top:3px solid #2C7A7B}
      .data-label{font-size:11px;color:#718096;text-transform:uppercase;font-weight:600}
      .data-value{font-size:18px;font-weight:700;color:#2C7A7B;margin-top:4px}
      .footer{margin-top:40px;border-top:1px solid #eee;padding-top:16px;text-align:center;color:#a0aec0;font-size:11px}
    </style></head><body>
      <div style="text-align:center;border-bottom:3px solid #2C7A7B;padding-bottom:20px;margin-bottom:24px">
        <h1>${t("fertilizer.report_title")}</h1>
        <p class="subtitle">${t("pdf.generated")} ${farmerName || ''} | ${genDate}</p>
        <div class="badge">${t("fertilizer.highly_suitable")}</div>
        <div class="fert-name">${fert}</div>
      </div>

      <div class="section">
        <div class="section-title">${t("fertilizer.nutrient_analysis")}</div>
        <div class="data-grid">
          <div class="data-cell"><div class="data-label">${t("crop.nitrogen")}</div><div class="data-value">${inputs.nitrogen || '--'} mg/kg</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.phosphorus")}</div><div class="data-value">${inputs.phosphorus || '--'} mg/kg</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.potassium")}</div><div class="data-value">${inputs.potassium || '--'} mg/kg</div></div>
          <div class="data-cell"><div class="data-label">${t("crop.soil_ph")}</div><div class="data-value">${inputs.ph || '--'}</div></div>
        </div>
      </div>

      ${buildSection(t("fertilizer.why_recommended") + " \u2014 " + fert, reason)}
      ${buildSection(t("crop.soil_health"), soil)}
      ${buildSection(t("fertilizer.application_guide"), strategy)}
      ${buildSection(t("fertilizer.risks"), risks)}

      <div class="footer">AgriSense AI &mdash; ${new Date().toLocaleString()}</div>
    </body></html>`;

    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (err) {
    console.error("Fertilizer PDF failed", err);
    throw err;
  }
};

// ─── CSV Export ───────────────────────────────────────────────────────────────
export const downloadCSV = async (data, dateRangeLabel) => {
  try {
    if (!data || data.length === 0) throw new Error("No data available to export.");
    let csvString = "Timestamp,Soil Moisture (%),Temperature (C),Humidity (%),Light (%),Motor Status,Mode\n";
    data.forEach(d => {
      const ts = new Date(d.timestamp).toLocaleString().replace(/,/g, '');
      csvString += `${ts},${d.soil},${d.temperature.toFixed(1)},${d.humidity.toFixed(1)},${d.light},${d.motor},${d.mode}\n`;
    });
    const filename = `agrisense_report_${dateRangeLabel.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
    const fileUri  = FileSystem.documentDirectory + filename;
    await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, { UTI: 'public.comma-separated-values-text', mimeType: 'text/csv' });
    }
  } catch (error) {
    console.error("CSV generation failed", error);
    throw new Error("Unable to export CSV. Please try again.");
  }
};
