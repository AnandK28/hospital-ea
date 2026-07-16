import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLock } from "../db";
import PatternPad from "../PatternPad";
import { colors } from "../theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

export default function LockScreen({ onUnlock }) {
  const [lock, setLock] = useState(null);
  const [pin, setPin] = useState("");

  useEffect(() => {
    getLock().then(setLock);
  }, []);

  const checkPin = async (value) => {
    if (value === lock.value) {
      onUnlock();
    } else {
      Alert.alert("Incorrect PIN");
      setPin("");
    }
  };

  const handleKey = (key) => {
    if (key === "") return;
    if (key === "DEL") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = pin + key;
    setPin(next);
    if (next.length >= (lock?.value?.length || 4)) {
      checkPin(next);
    }
  };

  const checkPattern = async (patternStr, len) => {
    if (len < 4) return;
    if (patternStr === lock.value) {
      onUnlock();
    } else {
      Alert.alert("Incorrect pattern");
    }
  };

  if (!lock) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.lockIcon}>
        <Ionicons name="lock-closed" size={28} color={colors.primary} />
      </View>
      <Text style={styles.appName}>Hospital Records</Text>
      <Text style={styles.title}>
        {lock.type === "pin" ? "Enter your PIN" : "Draw your pattern"}
      </Text>

      {lock.type === "pin" ? (
        <>
          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  i < pin.length && styles.pinDotFilled,
                ]}
              />
            ))}
          </View>
          <View style={styles.keypad}>
            {KEYS.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.key, k === "" && styles.keyHidden]}
                disabled={k === ""}
                onPress={() => handleKey(k)}
                activeOpacity={0.6}
              >
                {k === "DEL" ? (
                  <Ionicons name="backspace-outline" size={22} color={colors.textPrimary} />
                ) : (
                  <Text style={styles.keyText}>{k}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </>
      ) : (
        <PatternPad onComplete={checkPattern} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: { color: colors.textPrimary, fontSize: 20, fontWeight: "700", marginBottom: 4 },
  title: { color: colors.textSecondary, fontSize: 14, marginBottom: 28 },
  pinDotsRow: { flexDirection: "row", marginBottom: 32, minHeight: 16 },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginHorizontal: 7,
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  keypad: {
    width: 264,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    margin: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  keyHidden: { backgroundColor: "transparent", borderWidth: 0 },
  keyText: { color: colors.textPrimary, fontSize: 22, fontWeight: "500" },
});
