// ============================================================
// MotorToggle.js (FINAL WITH DURATION HISTORY)
// ============================================================

import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MotorToggle = ({ isOn, onToggle, loading = false }) => {
  const anim = useRef(new Animated.Value(isOn ? 1 : 0)).current;

  const [startTime, setStartTime] = useState(null);
  const [history, setHistory] = useState([]);

  // 🔥 Animation (UNCHANGED)
  useEffect(() => {
    Animated.spring(anim, {
      toValue: isOn ? 1 : 0,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();
  }, [isOn]);

  // 🔥 TRACK ON/OFF WITH DURATION
  useEffect(() => {
    if (isOn) {
      // motor started
      setStartTime(Date.now());

      setHistory((prev) => [
        {
          id: Date.now().toString(),
          type: "ON",
          time: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } else {
      // motor stopped
      if (startTime) {
        const end = Date.now();
        const durationSec = Math.floor((end - startTime) / 1000);

        setHistory((prev) => [
          {
            id: Date.now().toString(),
            type: "OFF",
            time: new Date().toLocaleTimeString(),
            duration: durationSec,
          },
          ...prev,
        ]);
      }
      setStartTime(null);
    }
  }, [isOn]);

  const handleToggle = () => {
    onToggle(!isOn);
  };

  // 🔥 FORMAT TIME
  const formatDuration = (sec) => {
    if (!sec) return "0s";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  const trackColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ccc", "#2e7d32"],
  });

  const thumbX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 34],
  });

  return (
    <View style={styles.wrapper}>

      {/* ICON */}
      <View style={[styles.iconWrap, { backgroundColor: isOn ? "#e8f5e9" : "#eee" }]}>
        <Ionicons
          name={isOn ? "water" : "water-outline"}
          size={40}
          color={isOn ? "#2e7d32" : "#999"}
        />
      </View>

      {/* STATUS */}
      <Text style={[styles.statusText, { color: isOn ? "#2e7d32" : "#999" }]}>
        Motor is {isOn ? "RUNNING" : "STOPPED"}
      </Text>

      <Text style={styles.subText}>
        {isOn ? "Water is flowing" : "Press to start irrigation"}
      </Text>

      {/* SWITCH */}
      <TouchableOpacity onPress={handleToggle} style={styles.switchOuter}>
        <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
          <Animated.View
            style={[styles.thumb, { transform: [{ translateX: thumbX }] }]}
          />
        </Animated.View>

        {/* FIXED OFF ALIGNMENT */}
        <Text style={styles.switchLabel}>
          {isOn ? "ON" : "OFF"}
        </Text>
      </TouchableOpacity>

      {/* HISTORY */}


    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    padding: 20,
  },

  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statusText: {
    fontSize: 20,
    fontWeight: "800",
  },

  subText: {
    color: "#777",
    marginBottom: 15,
  },

  switchOuter: {
    flexDirection: "row",
    alignItems: "center",
  },

  track: {
    width: 72,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
  },

  thumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff",
  },

  switchLabel: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
    width: 40,
    textAlign: "center",
  },

  historyBox: {
    width: "100%",
    marginTop: 20,
  },

  historyTitle: {
    fontWeight: "700",
    marginBottom: 10,
  },

  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  historyLeft: {
    fontWeight: "700",
  },

  historyRight: {
    color: "#666",
  },

  duration: {
    fontSize: 12,
    color: "#777",
  },
});

export default MotorToggle;