import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addPatientAndStay, updatePatientAndStay, getStayDetail, isMrnTaken, getMedications,
} from "../db";
import { colors, radii } from "../theme";
import DateField from "../DateField";

const PATIENT_FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "mrn", label: "MRN (unique)" },
  { key: "rch_id", label: "RCH ID" },
  { key: "phone_number", label: "Patient phone number" },
  { key: "address", label: "Address", multiline: true },
  { key: "vhn_name", label: "VHN name" },
  { key: "vhn_number", label: "VHN number" },
];

const STAY_FIELDS = [
  { key: "primary_diagnosis", label: "Primary diagnosis" },
  { key: "hospital_course", label: "Hospital course", multiline: true },
  { key: "discharge_condition", label: "Discharge condition", multiline: true },
];

const emptyMed = () => ({ drug_name: "", frequency: "", duration: "" });

// mode: "add" | "edit". When editing, pass stayId.
export default function RecordFormScreen({ mode, stayId, onBack, onSaved }) {
  const [form, setForm] = useState({});
  const [medications, setMedications] = useState([emptyMed()]);
  const [patientId, setPatientId] = useState(null);
  const [loading, setLoading] = useState(mode === "edit");
  const initialSnapshot = useRef("{}");

  useEffect(() => {
    if (mode === "edit" && stayId) {
      Promise.all([getStayDetail(stayId), getMedications(stayId)]).then(([detail, meds]) => {
        setForm(detail);
        setPatientId(detail.patient_id);
        const medRows = meds.length > 0
          ? meds.map((m) => ({ drug_name: m.drug_name, frequency: m.frequency, duration: m.duration }))
          : [emptyMed()];
        setMedications(medRows);
        initialSnapshot.current = JSON.stringify({ detail, medRows });
        setLoading(false);
      });
    } else {
      initialSnapshot.current = JSON.stringify({ detail: form, medRows: medications });
    }
  }, [mode, stayId]);

  const isDirty = () => JSON.stringify({ detail: form, medRows: medications }) !== initialSnapshot.current;

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
  }, [form, medications, onBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateMedRow = (idx, key, value) =>
    setMedications((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
  const addMedRow = () => setMedications((rows) => [...rows, emptyMed()]);
  const removeMedRow = (idx) => setMedications((rows) => rows.filter((_, i) => i !== idx));

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
    const cleanMeds = medications.filter((m) => m.drug_name && m.drug_name.trim());
    try {
      if (mode === "edit") {
        await updatePatientAndStay(stayId, patientId, form, cleanMeds);
        Alert.alert("Record updated");
      } else {
        await addPatientAndStay(form, cleanMeds);
        Alert.alert("Record saved");
      }
      initialSnapshot.current = JSON.stringify({ detail: form, medRows: medications });
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
        <Text style={styles.sectionTitle}>Patient</Text>
        {PATIENT_FIELDS.map(renderTextField)}

        <Text style={styles.sectionTitle}>Stay</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateHalf}>
            <DateField
              label="Date of admission"
              value={form.admission_date}
              onChange={(iso) => setField("admission_date", iso)}
            />
          </View>
          <View style={styles.dateHalf}>
            <DateField
              label="Date of discharge"
              value={form.discharge_date}
              onChange={(iso) => setField("discharge_date", iso)}
            />
          </View>
        </View>
        {STAY_FIELDS.map(renderTextField)}

        <Text style={styles.sectionTitle}>Medications</Text>
        {medications.map((m, idx) => (
          <View key={idx} style={styles.medRow}>
            <View style={styles.medInputs}>
              <TextInput
                style={[styles.input, styles.medDrug]}
                placeholder="Drug"
                placeholderTextColor={colors.textMuted}
                value={m.drug_name}
                onChangeText={(v) => updateMedRow(idx, "drug_name", v)}
              />
              <TextInput
                style={[styles.input, styles.medSmall]}
                placeholder="Frequency"
                placeholderTextColor={colors.textMuted}
                value={m.frequency}
                onChangeText={(v) => updateMedRow(idx, "frequency", v)}
              />
              <TextInput
                style={[styles.input, styles.medSmall]}
                placeholder="Duration"
                placeholderTextColor={colors.textMuted}
                value={m.duration}
                onChangeText={(v) => updateMedRow(idx, "duration", v)}
              />
            </View>
            {medications.length > 1 && (
              <TouchableOpacity onPress={() => removeMedRow(idx)} style={styles.medRemoveBtn}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addMedBtn} onPress={addMedRow}>
          <Ionicons name="add" size={16} color={colors.primary} />
          <Text style={styles.addMedBtnText}>Add Medication</Text>
        </TouchableOpacity>

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
  sectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 10,
  },
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
  dateRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  dateHalf: { flex: 1 },
  medRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  medInputs: { flex: 1, flexDirection: "row", gap: 8 },
  medDrug: { flex: 2 },
  medSmall: { flex: 1 },
  medRemoveBtn: { padding: 6 },
  addMedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  addMedBtnText: { color: colors.primary, fontWeight: "700", fontSize: 13 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  saveBtnText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
});
