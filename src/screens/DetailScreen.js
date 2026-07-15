import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { getStayDetail } from "../db";
import { exportRowsToExcel } from "../exportExcel";
import { colors, radii } from "../theme";

function Field({ label, value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

export default function DetailScreen({ stayId, onBack }) {
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getStayDetail(stayId).then(setDetail);
  }, [stayId]);

  const exportThis = async () => {
    if (!detail) return;
    await exportRowsToExcel([detail], `stay_${stayId}.xlsx`);
  };

  if (!detail) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.topBarBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Stay Details</Text>
        <TouchableOpacity onPress={exportThis}>
          <Text style={styles.topBarBtn}>📊</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.patientName}>
            {detail.first_name} {detail.last_name}
          </Text>
          <Text style={styles.patientMeta}>MRN {detail.mrn} · DOB {detail.dob}</Text>
        </View>

        <View style={styles.card}>
          <Field label="Admission" value={detail.admission_date} />
          <Field label="Discharge" value={detail.discharge_date} />
          <Field label="Primary Diagnosis" value={detail.primary_diagnosis} />
        </View>

        <View style={styles.card}>
          <Field label="Daily Progress Notes" value={detail.daily_progress_notes} />
          <Field label="Hospital Course" value={detail.hospital_course} />
          <Field label="Treatment Given" value={detail.treatment_given} />
        </View>

        <View style={styles.card}>
          <Field label="Discharge Condition" value={detail.discharge_condition} />
          <Field label="Discharge Advice" value={detail.discharge_advice} />
        </View>
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
  content: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: colors.primaryDim,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 14,
  },
  patientName: { color: colors.textPrimary, fontSize: 19, fontWeight: "700" },
  patientMeta: { color: colors.primary, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: colors.primary, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, color: colors.textPrimary, lineHeight: 21 },
});
