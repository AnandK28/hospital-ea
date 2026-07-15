import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from "react-native";
import { addPatientAndStay } from "../db";
import { colors, radii } from "../theme";

const FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "dob", label: "DOB (YYYY-MM-DD)" },
  { key: "mrn", label: "MRN (unique)" },
  { key: "primary_diagnosis", label: "Primary diagnosis" },
  { key: "daily_progress_notes", label: "Daily progress notes", multiline: true },
  { key: "hospital_course", label: "Hospital course", multiline: true },
  { key: "treatment_given", label: "Treatment given", multiline: true },
  { key: "discharge_condition", label: "Discharge condition", multiline: true },
  { key: "discharge_advice", label: "Discharge advice", multiline: true },
];

export default function AddScreen({ onBack, onSaved }) {
  const [form, setForm] = useState({});

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.first_name || !form.last_name || !form.mrn || !form.primary_diagnosis) {
      Alert.alert("First name, last name, MRN and diagnosis are required");
      return;
    }
    try {
      await addPatientAndStay(form);
      Alert.alert("Record saved");
      onSaved();
    } catch (e) {
      Alert.alert("Error", String(e.message || e));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.topBarBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Add Patient Record</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {FIELDS.map((f) => (
          <View key={f.key} style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <TextInput
              style={[styles.input, f.multiline && styles.multiline]}
              placeholder={f.label}
              placeholderTextColor={colors.textMuted}
              multiline={f.multiline}
              value={form[f.key] || ""}
              onChangeText={(v) => setField(f.key, v)}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save Record</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: 20 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: colors.textSecondary, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.input,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
});
