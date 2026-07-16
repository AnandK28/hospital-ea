import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  addInvestigationEntry, updateInvestigationEntry, getInvestigationEntry,
} from "../db";
import { colors, radii } from "../theme";
import { INVESTIGATION_GROUPS } from "../investigationFields";
import DateField from "../DateField";

export default function InvestigationEntryFormScreen({ stayId, entryId, onBack, onSaved }) {
  const [form, setForm] = useState({ entry_date: new Date().toISOString().slice(0, 10) });
  const [loading, setLoading] = useState(!!entryId);
  const initialSnapshot = useRef("{}");

  useEffect(() => {
    if (entryId) {
      getInvestigationEntry(entryId).then((entry) => {
        setForm(entry);
        initialSnapshot.current = JSON.stringify(entry);
        setLoading(false);
      });
    } else {
      initialSnapshot.current = JSON.stringify(form);
    }
  }, [entryId]);

  const isDirty = () => JSON.stringify(form) !== initialSnapshot.current;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.entry_date) {
      Alert.alert("Please set the date for this entry");
      return;
    }
    if (entryId) {
      await updateInvestigationEntry(entryId, form);
    } else {
      await addInvestigationEntry(stayId, form);
    }
    initialSnapshot.current = JSON.stringify(form);
    onSaved();
  };

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
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  if (loading) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.topBarBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{entryId ? "Edit Entry" : "New Entry"}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.fieldWrap}>
          <DateField
            label="Date"
            value={form.entry_date}
            onChange={(iso) => setField("entry_date", iso)}
          />
        </View>

        {INVESTIGATION_GROUPS.map((group) => (
          <View key={group.title} style={styles.groupCard}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.grid}>
              {group.fields.map((f) => (
                <View key={f.key} style={styles.gridItem}>
                  <Text style={styles.gridLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.gridInput}
                    value={form[f.key] || ""}
                    onChangeText={(v) => setField(f.key, v)}
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            multiline
            value={form.notes || ""}
            onChangeText={(v) => setField("notes", v)}
            placeholder="Progress notes for this day"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnText}>Save Entry</Text>
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
  content: { padding: 16, paddingBottom: 40 },
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
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  groupTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "31%" },
  gridLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginBottom: 4 },
  gridInput: {
    backgroundColor: colors.input,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  saveBtnText: { color: colors.bg, fontWeight: "800", fontSize: 15 },
});
