// ============================================================
// screens/MotorScreen.js
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from "../constants/theme";
import MotorToggle from "../components/MotorToggle";
import Card from "../components/Card";
import Button from "../components/Button";
import ScreenWrapper from "../components/ScreenWrapper";
import { apiSetMotorStatus, apiGetMotorLog, apiGetMotorStatus } from "../services/api";
import { saveMotorMode, getMotorMode, saveMotorStatus, getMotorStatus } from "../services/storage";
import { MOTOR_MODES } from "../constants";
import { formatDate, formatTimestamp } from "../utils";
import { useAuth } from "../context/AuthContext";

import { t } from '../services/i18n';

const MotorScreen = () => {
  const { appLanguage } = useAuth(); // Subscribe for language re-renders
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState(MOTOR_MODES.MANUAL);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [log, setLog] = useState([]);
  const [sensorData, setSensorData] = useState({ soil: null, temp: null, humidity: null, lastUpdate: null });
  const [activeTimer, setActiveTimer] = useState(null); // { turnOffAt: Date } from server
  const [timerRemain, setTimerRemain] = useState(null); // live seconds remaining

  // Command status overlay state
  // phase: null | 'syncing' | 'sending' | 'confirming' | 'done' | 'retrying'
  const [cmdStatus, setCmdStatus] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [timerDuration, setTimerDuration] = useState(null); // Backend manual timer
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownRef = useRef(null);
  const timerTickRef = useRef(null);
  const motorOnAtRef = useRef(null); // tracks when motor was turned ON for duration calc

  // Pulse animation for the overlay icon
  useEffect(() => {
    if (!cmdStatus || cmdStatus === 'done') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [cmdStatus]);

  // ── Live countdown ticker for active backend timer ──────────────────────────
  useEffect(() => {
    clearInterval(timerTickRef.current);
    if (!activeTimer?.turnOffAt) { setTimerRemain(null); return; }
    const tick = () => {
      const left = Math.max(0, Math.round((new Date(activeTimer.turnOffAt) - Date.now()) / 1000));
      setTimerRemain(left);
      if (left === 0) clearInterval(timerTickRef.current);
    };
    tick();
    timerTickRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerTickRef.current);
  }, [activeTimer]);

  // ── Core sync (sensors + active timer) ─────────────────────────────────────
  const syncLiveStatus = useCallback(async () => {
    try {
      const res = await apiGetMotorStatus();
      if (res && res.success && res.data) {
        const ts = res.data;

        setSensorData({
          soil: ts.soil,
          temp: ts.temp,
          humidity: ts.humidity,
          lastUpdate: ts.timestamp
        });

        // Sync active backend timer — if server says no timer, clear it
        setActiveTimer(ts.activeTimer || null);

        // If server reports timer expired and motor flipped off, sync UI
        if (!ts.activeTimer && ts.motor === '0') {
          setMode(currentMode => {
            if (currentMode === MOTOR_MODES.MANUAL) {
              setIsOn(false);
              saveMotorStatus('OFF');
            }
            return currentMode;
          });
        }

        setMode(currentMode => {
          if (currentMode === MOTOR_MODES.AUTO) {
            const incomingMotorOn = ts.motor === "1" || ts.motor === "ON";
            setIsOn(incomingMotorOn);
            saveMotorStatus(incomingMotorOn ? "ON" : "OFF");
          }
          return currentMode;
        });
      }
    } catch (err) {
      console.log("Telemetry sync silent skip...", err?.message);
    }
  }, []);

  // ── Pull-to-refresh handler ─────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [motorRes, logRes] = await Promise.all([
        apiGetMotorStatus(),
        apiGetMotorLog(),
      ]);
      if (motorRes?.data) {
        const ts = motorRes.data;
        setSensorData({ soil: ts.soil, temp: ts.temp, humidity: ts.humidity, lastUpdate: ts.timestamp });
        setActiveTimer(ts.activeTimer || null);
      }
      if (logRes?.data) setLog(logRes.data);
    } catch (_) { }
    setRefreshing(false);
  }, []);

  // ── Boot + polling loop ─────────────────────────────────────────────────────
  useEffect(() => {
    let intervalId;
    (async () => {
      const [savedMode, savedStatus] = await Promise.all([getMotorMode(), getMotorStatus()]);
      if (savedMode) setMode(savedMode.toLowerCase());
      if (savedStatus) setIsOn(savedStatus === "ON");
      try { const res = await apiGetMotorLog(); setLog(res.data); } catch (_) { }
      syncLiveStatus();
      intervalId = setInterval(syncLiveStatus, 7000);
    })();
    return () => clearInterval(intervalId);
  }, [syncLiveStatus]);

  // Helper: run a countdown timer visible in the overlay
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(countdownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Helper: orchestrate the full command flow with UX phases
  const sendMotorCommand = async (statusArg, modeArg, durationArg = null, isRetry = false) => {
    // Only flag true loading on first pass to prevent glitching the UI overlay on retry
    if (!isRetry) setLoading(true);
    setCmdStatus(isRetry ? 'retrying' : 'syncing');
    startCountdown(16);

    try {
      // Simulate phase transitions so the user sees progress
      const phaseTimer1 = setTimeout(() => setCmdStatus('sending'), 3000);
      const phaseTimer2 = setTimeout(() => setCmdStatus('confirming'), 10000);

      await apiSetMotorStatus(statusArg, modeArg, durationArg);

      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearInterval(countdownRef.current);
      setCountdown(0);

      setCmdStatus('done');
      // Flash success, then clear
      setTimeout(() => setCmdStatus(null), 1800);

      return { ok: true };
    } catch (err) {
      clearInterval(countdownRef.current);
      const httpStatus = err?.response?.status;

      // AUTO-RETRY LOGIC
      if (httpStatus === 429 && !isRetry) {
        setCmdStatus('retrying');
        startCountdown(16);
        // ThingSpeak requires exactly 15s between calls on free tier. We wait 16s safely.
        await new Promise(resolve => setTimeout(resolve, 16000));
        return await sendMotorCommand(statusArg, modeArg, durationArg, true); // Recursive retry
      }

      setCmdStatus(null);
      setCountdown(0);

      if (httpStatus === 429) {
        Alert.alert(
          "ThingSpeak Network Busy",
          "The automated retry failed because the hardware server is still busy. Please wait a few seconds and try pressing the button again."
        );
      } else {
        Alert.alert("Error", "Failed to send command. Check your connection.");
      }
      return { ok: false };
    } finally {
      if (!isRetry) setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (mode === MOTOR_MODES.AUTO) {
      Alert.alert(
        "Auto Mode Active",
        "Motor is in Auto Mode. Switch to Manual to control manually.",
        [{ text: "OK" }]
      );
      return;
    }
    const newStatus = isOn ? "OFF" : "ON";
    const passedDuration = newStatus === "ON" ? timerDuration : null;
    const { ok } = await sendMotorCommand(newStatus, mode, passedDuration);
    if (ok) {
      const now = new Date();

      // Calculate how long the motor was ON when turning it OFF
      let elapsedMin = null;
      if (newStatus === "OFF" && motorOnAtRef.current) {
        const diffMs = now - motorOnAtRef.current;
        elapsedMin = Math.max(1, Math.round(diffMs / 60000));
        motorOnAtRef.current = null;
      } else if (newStatus === "ON") {
        motorOnAtRef.current = now;
      }

      setIsOn(!isOn);
      await saveMotorStatus(newStatus);
      setLog((prev) => [
        { _id: "log_" + Date.now(), status: newStatus, mode, timestamp: now.toISOString(), duration: elapsedMin },
        ...prev.slice(0, 9),
      ]);
    }
  };

  const handleModeChange = async (newMode) => {
    if (newMode === mode) return;

    if (newMode === MOTOR_MODES.AUTO) {
      Alert.alert(
        "Enable Auto Mode?",
        "In Auto Mode, the motor will turn ON/OFF automatically based on soil moisture levels.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Enable Auto",
            onPress: async () => {
              const { ok } = await sendMotorCommand(isOn ? "ON" : "OFF", "auto");
              if (ok) {
                setMode(MOTOR_MODES.AUTO);
                await saveMotorMode(MOTOR_MODES.AUTO);
              }
            },
          },
        ]
      );
    } else {
      // Switching to MANUAL — send OFF command immediately
      const { ok } = await sendMotorCommand("OFF", "manual");
      if (ok) {
        setIsOn(false);
        setMode(MOTOR_MODES.MANUAL);
        await saveMotorMode(MOTOR_MODES.MANUAL);
        await saveMotorStatus("OFF");
      }
    }
  };

  // Command status overlay meta
  const overlayMeta = {
    syncing: { icon: 'sync', color: '#3182CE', label: 'Syncing with sensor hub…', sub: 'Waiting for ThingSpeak slot' },
    sending: { icon: 'wifi', color: '#DD6B20', label: 'Sending command to hardware…', sub: 'ESP32 will receive in ~10s' },
    confirming: { icon: 'checkmark-done', color: '#38A169', label: 'Confirming with sensor…', sub: 'Almost there…' },
    retrying: { icon: 'refresh', color: '#E53E3E', label: 'Network busy, auto-retrying…', sub: 'Waiting for IoT slot (15s)' },
    done: { icon: 'checkmark-circle', color: '#38A169', label: 'Command delivered!', sub: 'Hardware updated successfully' },
  };
  const meta = overlayMeta[cmdStatus];

  return (
    <ScreenWrapper backgroundColor={COLORS.primary} edges={["top", "left", "right"]}>

      {/* ✨ Command Status Overlay */}
      {cmdStatus && meta && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Animated.View style={[
              styles.overlayIconCircle,
              { backgroundColor: meta.color + '18', transform: [{ scale: pulseAnim }] }
            ]}>
              <Ionicons name={meta.icon} size={40} color={meta.color} />
            </Animated.View>
            <Text style={styles.overlayLabel}>{meta.label}</Text>
            <Text style={styles.overlaySub}>{meta.sub}</Text>
            {countdown > 0 && cmdStatus !== 'done' && (
              <View style={styles.countdownRow}>
                <View style={[styles.countdownBar, { width: `${(countdown / 16) * 100}%`, backgroundColor: meta.color }]} />
              </View>
            )}
            {countdown > 0 && cmdStatus !== 'done' && (
              <Text style={[styles.countdownText, { color: meta.color }]}>
                {countdown}s remaining
              </Text>
            )}
          </View>
        </View>
      )}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.white}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{t("motor.title")}</Text>
          <Text style={styles.bannerSub}>{t("motor.title_sub")}</Text>
        </View>

        {/* Active Timer Badge */}
        {activeTimer && timerRemain !== null && timerRemain > 0 && (
          <View style={styles.timerBadge}>
            <Ionicons name="timer-outline" size={20} color="#C05621" />
            <View style={{ flex: 1 }}>
              <Text style={styles.timerBadgeTitle}>Auto-Off Timer Active</Text>
              <Text style={styles.timerBadgeSub}>
                Motor will turn OFF in{" "}
                <Text style={{ fontWeight: '800', color: '#C05621' }}>
                  {Math.floor(timerRemain / 60)}m {String(timerRemain % 60).padStart(2, '0')}s
                </Text>
              </Text>
            </View>
            <View style={styles.timerRing}>
              <Text style={styles.timerRingText}>{timerRemain}s</Text>
            </View>
          </View>
        )}

        {/* Mode selector */}
        <View style={[styles.modeCard, SHADOWS.md]}>
          <Text style={styles.modeLabel}>{t("motor.mode")}</Text>
          <View style={styles.modeToggle}>
            {Object.values(MOTOR_MODES).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => handleModeChange(m)}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={m === MOTOR_MODES.AUTO ? "flash" : "hand-right"}
                  size={16}
                  color={mode === m ? COLORS.white : COLORS.textSecondary}
                />
                <Text style={[styles.modeBtnText, mode === m && styles.modeBtnTextActive]}>
                  {m === MOTOR_MODES.AUTO ? t("motor.mode_auto") : t("motor.mode_manual")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.modeHint}>
            {mode === MOTOR_MODES.AUTO
              ? t("motor.auto_warning")
              : t("motor.toggle_instruction")}
          </Text>
        </View>

        {/* Main motor control */}
        <View style={[styles.motorCard, SHADOWS.lg]}>

          {/* Timer UI (Only show when motor is OFF and mode is MANUAL) */}
          {!isOn && mode === MOTOR_MODES.MANUAL && (
            <View style={{ marginBottom: SPACING.lg, paddingBottom: SPACING.md, borderBottomWidth: 1, borderColor: COLORS.borderLight }}>
              <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: "600", color: COLORS.textSecondary, marginBottom: SPACING.sm, textAlign: "center" }}>
                {t("motor.timer_label")}
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                {[
                  { label: t("motor.timer_none"), value: null },
                  { label: t("motor.timer_15m"), value: 15 },
                  { label: t("motor.timer_30m"), value: 30 },
                  { label: t("motor.timer_1h"), value: 60 }
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.label}
                    activeOpacity={0.8}
                    onPress={() => setTimerDuration(opt.value)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 20,
                      backgroundColor: timerDuration === opt.value ? COLORS.primary + "1A" : COLORS.background,
                      borderWidth: 1,
                      borderColor: timerDuration === opt.value ? COLORS.primary : COLORS.borderLight,
                    }}
                  >
                    <Text style={{
                      fontSize: FONT_SIZES.xs,
                      fontWeight: timerDuration === opt.value ? "700" : "500",
                      color: timerDuration === opt.value ? COLORS.primary : COLORS.textSecondary
                    }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Timer Input */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Text style={{ fontSize: FONT_SIZES.xs, color: COLORS.textTertiary }}>Custom:</Text>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    width: 80,
                    textAlign: "center",
                    fontSize: FONT_SIZES.sm,
                    color: COLORS.textPrimary,
                    backgroundColor: COLORS.white,
                  }}
                  placeholder="Mins"
                  keyboardType="numeric"
                  value={timerDuration ? String(timerDuration) : ""}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10);
                    setTimerDuration(isNaN(num) ? null : num);
                  }}
                />
              </View>

            </View>
          )}

          <MotorToggle isOn={isOn} onToggle={handleToggle} loading={loading} />

          {mode === MOTOR_MODES.AUTO && (
            <View style={styles.autoNotice}>
              <Ionicons name="information-circle" size={16} color={COLORS.info} />
              <Text style={styles.autoNoticeText}>
                {t("motor.auto_mode_notice")}
              </Text>
            </View>
          )}

          <Button
            title={isOn ? `Turn Motor ${t("motor.off")}` : `Turn Motor ${t("motor.on")}`}
            onPress={handleToggle}
            variant={isOn ? "danger" : "primary"}
            loading={loading}
            disabled={mode === MOTOR_MODES.AUTO}
            icon={isOn ? "power" : "water"}
            size="lg"
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          {[
            { label: t("motor.sessions_today"), value: log.filter((l) => (l.status || l.action) === "ON").length, icon: "repeat", color: COLORS.info },
            { label: t("motor.current_mode"), value: mode, icon: "settings", color: COLORS.primary },
            { label: t("motor.status_label"), value: isOn ? t("motor.running") : t("motor.stopped"), icon: "pulse", color: isOn ? COLORS.success : COLORS.danger },
          ].map(({ label, value, icon, color }) => (
            <View key={label} style={[styles.statCard, SHADOWS.sm]}>
              <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
                <Ionicons name={icon} size={18} color={color} />
              </View>
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Live ESP32 Telemetry Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("motor.telemetry_title")}</Text>
        </View>
        <View style={styles.telemetryGrid}>
          <View style={[styles.telemetryCard, SHADOWS.sm]}>
            <Ionicons name="water-outline" size={24} color="#3182CE" />
            <Text style={styles.telemetryValue}>
              {sensorData.soil != null ? `${sensorData.soil}%` : "--"}
            </Text>
            <Text style={styles.telemetryLabel}>{t("motor.soil_moisture")}</Text>
          </View>
          <View style={[styles.telemetryCard, SHADOWS.sm]}>
            <Ionicons name="thermometer-outline" size={24} color="#DD6B20" />
            <Text style={styles.telemetryValue}>
              {sensorData.temp != null ? `${sensorData.temp}°C` : "--"}
            </Text>
            <Text style={styles.telemetryLabel}>{t("dashboard.temperature")}</Text>
          </View>
          <View style={[styles.telemetryCard, SHADOWS.sm]}>
            <Ionicons name="cloud-outline" size={24} color="#38A169" />
            <Text style={styles.telemetryValue}>
              {sensorData.humidity != null ? `${sensorData.humidity}%` : "--"}
            </Text>
            <Text style={styles.telemetryLabel}>{t("motor.air_humidity")}</Text>
          </View>
        </View>
        <Text style={{ textAlign: 'center', fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginBottom: SPACING.md }}>
          {sensorData.lastUpdate ? t("motor.last_sync") + ": " + formatTimestamp(sensorData.lastUpdate) : t("motor.awaiting_sync")}
        </Text>

        {/* Activity log */}
        {log.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("motor.recent_activity")}</Text>
          </View>
        )}

        {log.slice(0, 8).map((entry, index) => {
          const actionStatus = entry.status || entry.action;
          const isON = actionStatus === "ON";
          return (
            <View key={entry._id || entry.id || index} style={[styles.logItem, SHADOWS.sm]}>
              <View style={[styles.logDot, { backgroundColor: isON ? COLORS.success : COLORS.danger }]} />
              <View style={styles.logBody}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' }}>
                  <Text style={styles.logAction} numberOfLines={1}>
                    {t("motor.motor_turned")}{" "}
                    <Text style={{ color: isON ? COLORS.success : COLORS.danger, fontWeight: "700" }}>
                      {isON ? t("motor.on") : t("motor.off")}
                    </Text>
                  </Text>
                  {entry.duration != null && (
                    <View style={styles.logDuration}>
                      <Text style={styles.logDurationText}>🕐 {entry.duration}m</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.logMeta}>
                  {entry.mode} · {formatTimestamp(entry.timestamp)}
                </Text>
              </View>
            </View>
          );
        })}

      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: SPACING.xxxl },

  banner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  bannerTitle: { fontSize: FONT_SIZES.xl, fontWeight: "800", color: COLORS.white },
  bannerSub: { fontSize: FONT_SIZES.sm, color: "rgba(255,255,255,0.75)", marginTop: 4 },

  modeCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
  },
  modeLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  modeBtnActive: { backgroundColor: COLORS.primary },
  modeBtnText: { fontSize: FONT_SIZES.sm, fontWeight: "600", color: COLORS.textSecondary },
  modeBtnTextActive: { color: COLORS.white },
  modeHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    lineHeight: 18,
  },

  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#FFFAF0',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#FBD38D',
  },
  timerBadgeTitle: { fontSize: FONT_SIZES.xs, fontWeight: '800', color: '#C05621', textTransform: 'uppercase' },
  timerBadgeSub: { fontSize: FONT_SIZES.xs, color: '#744210', marginTop: 2 },
  timerRing: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#C05621',
    alignItems: 'center', justifyContent: 'center',
  },
  timerRingText: { fontSize: 11, fontWeight: '900', color: '#fff' },

  motorCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
  },

  autoNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.infoBg,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.sm,
  },
  autoNoticeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.info,
    flex: 1,
  },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginTop: SPACING.base,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    alignItems: "center",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  statValue: { fontSize: FONT_SIZES.sm, fontWeight: "800" },
  statLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, textAlign: "center", marginTop: 2 },

  sectionHeader: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: "700", color: COLORS.textPrimary },

  logItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  logDot: { width: 10, height: 10, borderRadius: 5 },
  logBody: { flex: 1 },
  logAction: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: "600" },
  logMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 2 },
  logDuration: {
    backgroundColor: COLORS.primaryFaint,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  logDurationText: { fontSize: FONT_SIZES.xs, color: COLORS.primary, fontWeight: "600" },

  telemetryGrid: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    gap: SPACING.sm,
    marginBottom: SPACING.sm
  },
  telemetryCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border
  },
  telemetryValue: { fontSize: FONT_SIZES.base, fontWeight: '800', color: COLORS.textPrimary, marginTop: SPACING.xs },
  telemetryLabel: { fontSize: 10, color: COLORS.textSecondary, textTransform: 'uppercase', fontWeight: '700', marginTop: 2 },

  // Command overlay
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  overlayCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.lg,
  },
  overlayIconCircle: {
    width: 88, height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  overlayLabel: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  overlaySub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  countdownRow: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  countdownBar: {
    height: '100%',
    borderRadius: 3,
  },
  countdownText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
  },
});

export default MotorScreen;
