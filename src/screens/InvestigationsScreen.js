import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getInvestigations } from "../db";
import { colors, radii } from "../theme";
import { INVESTIGATION_GROUPS } from "../investigationFields";

const ROW_HEIGHT = 40;
const LABEL_COL_WIDTH = 130;
const DATE_COL_WIDTH = 92;

function shortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export default function InvestigationsScreen({ stayId, onBack, onAddEntry, onEditEntry }) {
  const [entries, setEntries] = useState([]);

  const load = useCallback(async () => {
    const rows = await getInvestigations(stayId);
    setEntries(rows);
  }, [stayId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.topBarBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>Investigations</Text>
        <TouchableOpacity onPress={onAddEntry} style={styles.addBtn}>
          <Ionicons name="add" size={20} color={colors.bg} />
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.empty}>No investigation entries yet</Text>
          <TouchableOpacity style={styles.emptyAddBtn} onPress={onAddEntry}>
            <Text style={styles.emptyAddBtnText}>+ Add first entry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView>
          <View style={{ flexDirection: "row" }}>
            <View style={{ width: LABEL_COL_WIDTH }}>
              <View style={[styles.headerCell, { width: LABEL_COL_WIDTH, alignItems: "flex-start" }]}>
                <Text style={styles.headerCellText}>Test</Text>
              </View>
              {INVESTIGATION_GROUPS.map((group) => (
                <React.Fragment key={group.title}>
                  <View style={styles.groupRow}>
                    <Text style={styles.groupRowText} numberOfLines={1}>{group.title}</Text>
                  </View>
                  {group.fields.map((f) => (
                    <View key={f.key} style={[styles.labelCell, { width: LABEL_COL_WIDTH }]}>
                      <Text style={styles.labelCellText}>{f.label}</Text>
                    </View>
                  ))}
                </React.Fragment>
              ))}
              <View style={[styles.labelCell, { width: LABEL_COL_WIDTH }]}>
                <Text style={styles.labelCellText}>Notes</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={{ flexDirection: "row" }}>
                {entries.map((entry) => (
                  <TouchableOpacity
                    key={entry.entry_id}
                    style={{ width: DATE_COL_WIDTH }}
                    onPress={() => onEditEntry(entry.entry_id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.headerCell, { width: DATE_COL_WIDTH }]}>
                      <Text style={styles.headerCellText}>{shortDate(entry.entry_date)}</Text>
                    </View>
                    {INVESTIGATION_GROUPS.map((group) => (
                      <React.Fragment key={group.title}>
                        <View style={styles.groupRow} />
                        {group.fields.map((f) => (
                          <View key={f.key} style={styles.valueCell}>
                            <Text style={styles.valueCellText} numberOfLines={1}>
                              {entry[f.key] || "—"}
                            </Text>
                          </View>
                        ))}
                      </React.Fragment>
                    ))}
                    <View style={styles.valueCell}>
                      <Text style={styles.valueCellText} numberOfLines={1}>
                        {entry.notes || "—"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </ScrollView>
      )}
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
  topBarTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: "700", flex: 1, textAlign: "center" },
  topBarBtn: { color: colors.primary, fontSize: 15, fontWeight: "600" },
  backRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  addBtn: {
    backgroundColor: colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: { alignItems: "center", marginTop: 48 },
  empty: { textAlign: "center", color: colors.textMuted },
  emptyAddBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: colors.primaryDim, borderRadius: radii.md },
  emptyAddBtnText: { color: colors.primary, fontWeight: "700" },
  headerCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
  },
  headerCellText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  groupRow: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    backgroundColor: colors.primaryDim,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
  },
  groupRowText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
  labelCell: {
    height: ROW_HEIGHT,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
  },
  labelCellText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  valueCell: {
    height: ROW_HEIGHT,
    width: DATE_COL_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
  },
  valueCellText: { color: colors.textPrimary, fontSize: 12 },
});
