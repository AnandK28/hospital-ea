import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getLock, setLock } from "../db";
import PatternPad from "../PatternPad";
import { colors, radii } from "../theme";

export default function ChangeLockScreen({ onBack }) {
  const [lock, setLockState] = useState(null);
  const [stage, setStage] = useState("verify");
  const [pinInput, setPinInput] = useState("");
  const [newType, setNewType] = useState(null);
  const [newPin, setNewPin] = useState("");

  useEffect(() => {
    getLock().then(setLockState);
  }, []);

  if (!lock) return <View style={styles.container} />;

  const verify = (value) => {
    if (value === lock.value) {
      setStage("choose");
    } else {
      Alert.alert("Verification failed");
      setPinInput("");
    }
  };

  const saveNewPin = async () => {
    if (newPin.length < 4) {
      Alert.alert("PIN must be at least 4 digits");
      return;
    }
    await setLock("pin", newPin);
    Alert.alert("Lock updated to PIN");
    onBack();
  };

  const saveNewPattern = async (patternStr, len) => {
    if (len < 4) {
      Alert.alert("Pattern must connect at least 4 dots");
      return;
    }
    await setLock("pattern", patternStr);
    Alert.alert("Lock updated to Pattern");
    onBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.topBarBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Change Lock</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        {stage === "verify" && (
          <>
            <Text style={styles.label}>
              Verify your current {lock.type === "pin" ? "PIN" : "pattern"}
            </Text>
            {lock.type === "pin" ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Current PIN"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry
                  keyboardType="number-pad"
                  value={pinInput}
                  onChangeText={setPinInput}
                />
                <TouchableOpacity style={styles.btn} onPress={() => verify(pinInput)}>
                  <Text style={styles.btnText}>Verify</Text>
                </TouchableOpacity>
              </>
            ) : (
              <PatternPad onComplete={(str, len) => len >= 4 && verify(str)} />
            )}
          </>
        )}

        {stage === "choose" && (
          <>
            <Text style={styles.label}>Choose new lock type</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.btn}
                onPress={() => {
                  setNewType("pin");
                  setStage("set");
                }}
              >
                <Text style={styles.btnText}>Use PIN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnOutline}
                onPress={() => {
                  setNewType("pattern");
                  setStage("set");
                }}
              >
                <Text style={styles.btnOutlineText}>Use Pattern</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {stage === "set" && newType === "pin" && (
          <>
            <Text style={styles.label}>Enter new PIN (min 4 digits)</Text>
            <TextInput
              style={styles.input}
              placeholder="New PIN"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              keyboardType="number-pad"
              value={newPin}
              onChangeText={setNewPin}
            />
            <TouchableOpacity style={styles.btn} onPress={saveNewPin}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </>
        )}

        {stage === "set" && newType === "pattern" && (
          <>
            <Text style={styles.label}>Draw new pattern (connect 4+ dots)</Text>
            <PatternPad onComplete={saveNewPattern} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    backgroundColor: colors.surface,
    paddingTop: 54,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: "700" },
  topBarBtn: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  content: { padding: 24, alignItems: "center", marginTop: 20 },
  label: { fontSize: 15, color: colors.textPrimary, marginBottom: 18, textAlign: "center" },
  input: {
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    width: 220,
    textAlign: "center",
    color: colors.textPrimary,
  },
  row: { flexDirection: "row", gap: 12 },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: { color: colors.bg, fontWeight: "800" },
  btnOutline: {
    borderRadius: radii.md,
    paddingVertical: 13,
    paddingHorizontal: 22,
    alignItems: "center",
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  btnOutlineText: { color: colors.primary, fontWeight: "800" },
});
