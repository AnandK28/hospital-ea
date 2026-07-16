import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addPatientAndStay, updatePatientAndStay, getStayDetail, isMrnTaken } from "../db";
import { colors, radii } from "../theme";
import DateField from "../DateField";

const TEXT_FIELDS_TOP = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "mrn", label: "MRN (unique)" },
];

const TEXT_FIELDS_BOTTOM = [
  { key: "primary_diagnosis", label: "Primary diagnosis" },
  { key: "daily_progress_notes", label: "Daily progress notes", multiline: true },
  { key: "hospital_course", label: "Hospital course", multiline: true },
  { key: "treatment_given", label: "Treatment given", multiline: true },
  { key: "discharge_condition", label: "Discharge condition", multiline: true },
  { key: "discharge_advice", label: "Discharge advice", multiline: true },
];

// mode: "add" | "edit". When editing, pass stayId.
export default function RecordFormScreen({ mode, stayId, onBack, onSaved }) {
  const [form, setForm] = useState({});
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(mode === "edit");
  const initialSnapshot = useRef("{}");

  useEffect(() => {
    if (mode === "edit" && stayId) {
      getStayDetail(stayId).then((detail) => {
        setForm(detail);
        setPatientId(detail.patient_id);
        initialSnapshot.current = JSON.stringify(detail);
        setLoading(false);
      });
    }
  }, [mode, stayId]);

  const isDirty = () => JSON.stringify(form) !== initialSnapshot.current;

  const handleBack = useCallback(() => {
    if (isDirty()) {
      Alert.alert(
        "Unsaved changes",
        "Do you want to save your changes before leaving?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: onBack },
          { text: "Save", onPress: save },
        ]
      );
    } else {
      onBack();
    }
  }, [form, onBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true; // always intercept while this screen is open
    });
    return () => sub.remove();
  }, [handleBack]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.first_name || !form.last_name || !form.mrn || !form.primary_diagnosis) {
      Alert.alert("First name, last name, MRN and diagnosis are required");
      return;
    }
    const taken = await isMrnTaken(form.mrn, mode === "edit" ? patientId : null);
    if (taken) {
      Alert.alert("MRN already in use", "Another patient already has this MRN. Please use a unique one.");
      return;
    }
    try {
      if (mode === "edit") {
        await updatePatientAndStay(stayId, patientId, form);
        Alert.alert("Record updated");
      } else {
        await addPatientAndStay(form);
        Alert.alert("Record saved");
      }
      initialSnapshot.current = JSON.stringify(form);
      onSaved();
    } catch (e) {
      Alert.alert("Error", String(e.message || e));
    }
  };

  const renderTextField = (f) => (
    <View key={f.key} style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{f.label}</Text>
      <TextInput
        style={[styles.input, f.multiline && styles.multiline]}
        placeholder={f.label}
        placeholderTextColor={colors.textMuted}
        multiline={f.multiline}
        value={form[f.key] != null ? String(form[f.key]) : ""}
        onChangeText={(v) => setField(f.key, v)}
      />
    </View>
  );

  if (loading) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.topBarBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {mode === "edit" ? "Edit Record" : "Add Patient Record"}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {TEXT_FIELDS_TOP.map(renderTextField)}

        <View style={styles.fieldWrap}>
          <DateField
            label="DOB"
            value={form.dob}
            onChange={(iso) => setField("dob", iso)}
          />
        </View>

        {TEXT_FIELDS_BOTTOM.map(renderTextField)}

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>
            {mode === "edit" ? "Save Changes" : "Save Record"}
          </Text>
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
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
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
