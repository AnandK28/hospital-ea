import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "./theme";
import { isoToDisplay, displayToIso, formatTypingInput } from "./dateUtils";

// value/onChange work in ISO (YYYY-MM-DD) so it stays consistent with storage & search.
export default function DateField({ label, value, onChange }) {
  const [showPicker, setShowPicker] = useState(false);
  const [text, setText] = useState(isoToDisplay(value));

  const handleTextChange = (t) => {
    const formatted = formatTypingInput(t);
    setText(formatted);
    const iso = displayToIso(formatted);
    onChange(iso);
  };

  const handlePickerChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === "ios"); // iOS picker stays open inline; Android closes itself
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      onChange(iso);
      setText(isoToDisplay(iso));
    }
  };

  const dateForPicker = value ? new Date(value) : new Date();

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YY"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={handleTextChange}
          keyboardType="number-pad"
          maxLength={8}
        />
        <TouchableOpacity style={styles.calBtn} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      {showPicker && (
        <DateTimePicker
          value={dateForPicker}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={handlePickerChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
  },
  calBtn: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
});
