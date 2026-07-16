import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getStayDetail, deleteStay, getStaysForPatient, getMedications } from "../db";
import { exportStayToPdf } from "../exportPdf";
import { colors, radii } from "../theme";
import { formatDateHeader } from "../dateUtils";

function Field({ label, value }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || "—"}</Text>
    </View>
  );
}

export default function DetailScreen({ stayId, onBack, onEdit, onOpenDetail, onOpenInvestigations }) {
  const [detail, setDetail] = useState(null);
  const [medications, setMedications] = useState([]);
  const [otherStays, setOtherStays] = useState([]);

  const load = useCallback(async () => {
    const d = await getStayDetail(stayId);
    setDetail(d);
    if (d) {
      const [others, meds] = await Promise.all([
        getStaysForPatient(d.patient_id, stayId),
        getMedications(stayId),
      ]);
      setOtherStays(others);
      setMedications(meds);
    }
  }, [stayId]);

  useEffect(() => {
    load();
  }, [load]);

  const exportThis = async () => {
    if (!detail) return;
    await exportStayToPdf(detail, medications);
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete this record?",
      `This will permanently remove ${detail.first_name} ${detail.last_name}'s record for this stay, including medications and investigations. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteStay(detail.stay_id, detail.patient_id);
            onBack();
          },
        },
      ]
    );
  };

  if (!detail) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.topBarBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Stay Details</Text>
        <TouchableOpacity onPress={exportThis} style={styles.backRow}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <Text style={styles.topBarBtn}>PDF</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <Text style={styles.patientName}>
            {detail.first_name} {detail.last_name}
          </Text>
          <Text style={styles.patientMeta}>MRN {detail.mrn}{detail.rch_id ? ` · RCH ${detail.rch_id}` : ""}</Text>
        </View>

        <View style={styles.card}>
          <Field label="Phone Number" value={detail.phone_number} />
          <Field label="Address" value={detail.address} />
          <Field label="VHN Name" value={detail.vhn_name} />
          <Field label="VHN Number" value={detail.vhn_number} />
        </View>

        <View style={styles.card}>
          <Field label="Date of Admission" value={formatDateHeader(detail.admission_date)} />
          <Field label="Date of Discharge" value={formatDateHeader(detail.discharge_date)} />
          <Field label="Primary Diagnosis" value={detail.primary_diagnosis} />
        </View>

        <View style={styles.card}>
          <Field label="Hospital Course" value={detail.hospital_course} />
          <Field label="Discharge Condition" value={detail.discharge_condition} />
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Medications</Text>
          </View>
          {medications.length === 0 ? (
            <Text style={styles.fieldValue}>No medications recorded</Text>
          ) : (
            <>
              <View style={styles.medHeaderRow}>
                <Text style={[styles.medHeaderText, { flex: 2 }]}>Drug</Text>
                <Text style={[styles.medHeaderText, { flex: 1 }]}>Frequency</Text>
                <Text style={[styles.medHeaderText, { flex: 1 }]}>Duration</Text>
              </View>
              {medications.map((m) => (
                <View key={m.medication_id} style={styles.medRow}>
                  <Text style={[styles.medCellText, { flex: 2 }]}>{m.drug_name}</Text>
                  <Text style={[styles.medCellText, { flex: 1 }]}>{m.frequency || "—"}</Text>
                  <Text style={[styles.medCellText, { flex: 1 }]}>{m.duration || "—"}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <TouchableOpacity style={styles.investigationsBtn} onPress={onOpenInvestigations}>
          <Ionicons name="flask-outline" size={18} color={colors.primary} />
          <Text style={styles.investigationsBtnText}>View Investigations</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        {otherStays.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.historyTitle}>
              Other stays for {detail.first_name} ({otherStays.length})
            </Text>
            {otherStays.map((s) => (
              <TouchableOpacity
                key={s.stay_id}
                style={styles.historyRow}
                onPress={() => onOpenDetail && onOpenDetail(s.stay_id)}
              >
                <View>
                  <Text style={styles.historyDate}>{formatDateHeader(s.admission_date)}</Text>
                  <Text style={styles.historyDiagnosis}>{s.primary_diagnosis}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.editBtn} onPress={() => onEdit(stayId)}>
          <Text style={styles.editBtnText}>Edit Record</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Text style={styles.deleteBtnText}>Delete Record</Text>
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
  topBarBtn: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
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
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: colors.primary, marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldValue: { fontSize: 15, color: colors.textPrimary, lineHeight: 21 },
  medHeaderRow: { flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  medHeaderText: { color: colors.primary, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  medRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  medCellText: { color: colors.textPrimary, fontSize: 13 },
  investigationsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  investigationsBtnText: { color: colors.textPrimary, fontWeight: "700", fontSize: 14 },
  historyTitle: { fontSize: 13, fontWeight: "700", color: colors.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyDate: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  historyDiagnosis: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  editBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  editBtnText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
  deleteBtn: {
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  deleteBtnText: { color: colors.danger, fontWeight: "700", fontSize: 15 },
});
