import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SectionList, StyleSheet,
  Alert, Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { searchPatients, getStaysForMonth } from "../db";
import { exportRowsToExcel } from "../exportExcel";
import { backupToFile, restoreFromFile } from "../backup";
import { colors, radii } from "../theme";
import { formatDateHeader, formatMonthLabel } from "../dateUtils";

const SORT_OPTIONS = ["date", "name", "diagnosis"];
const SORT_LABELS = { date: "Date", name: "Name", diagnosis: "Diagnosis" };
const STATUS_OPTIONS = [
  { key: "all", label: "All" },
  { key: "admitted", label: "Admitted" },
  { key: "discharged", label: "Discharged" },
];

function groupByDate(rows) {
  const map = {};
  for (const r of rows) {
    const day = (r.admission_date || "").slice(0, 10) || "unknown";
    if (!map[day]) map[day] = [];
    map[day].push(r);
  }
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map((day) => ({ title: day, data: map[day] }));
}

export default function SearchScreen({ onOpenDetail, onGoAdd, onGoChangeLock }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [rows, setRows] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const loadMonth = useCallback(async (y, m) => {
    const data = await getStaysForMonth(y, m);
    setRows(data);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    loadMonth(year, month);
  }, [year, month, loadMonth]);

  const shiftMonth = (delta) => {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  };

  const runSearch = async () => {
    if (!query.trim()) {
      loadMonth(year, month);
      return;
    }
    const data = await searchPatients(query.trim());
    setRows(data);
    setIsSearching(true);
  };

  const clearSearch = () => {
    setQuery("");
    loadMonth(year, month);
  };

  const cycleSort = () => {
    const idx = SORT_OPTIONS.indexOf(sortBy);
    setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]);
  };

  const filteredRows = useMemo(() => {
    if (statusFilter === "admitted") return rows.filter((r) => !r.discharge_date);
    if (statusFilter === "discharged") return rows.filter((r) => !!r.discharge_date);
    return rows;
  }, [rows, statusFilter]);

  const sections = useMemo(() => {
    if (sortBy === "date") return groupByDate(filteredRows);
    const sorted = [...filteredRows].sort((a, b) => {
      if (sortBy === "name") {
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      }
      return (a.primary_diagnosis || "").localeCompare(b.primary_diagnosis || "");
    });
    return [{ title: `sorted-${sortBy}`, data: sorted }];
  }, [filteredRows, sortBy]);

  const exportCurrent = async () => {
    setMenuOpen(false);
    if (filteredRows.length === 0) {
      Alert.alert("No records to export");
      return;
    }
    await exportRowsToExcel(filteredRows);
  };

  const doBackup = async () => {
    setMenuOpen(false);
    try {
      await backupToFile();
    } catch (e) {
      Alert.alert("Backup failed", String(e.message || e));
    }
  };

  const doRestore = () => {
    setMenuOpen(false);
    Alert.alert(
      "Restore from backup?",
      "This replaces all current records with the ones in the backup file. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Choose File…",
          onPress: async () => {
            try {
              const result = await restoreFromFile();
              if (result) {
                Alert.alert(
                  "Restore complete",
                  `Restored ${result.patientCount} patients, ${result.stayCount} stays.`
                );
                loadMonth(year, month);
              }
            } catch (e) {
              Alert.alert("Restore failed", String(e.message || e));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Hospital Records</Text>
          <Text style={styles.topBarSub}>
            {filteredRows.length} record{filteredRows.length !== 1 ? "s" : ""}
            {isSearching ? " (search)" : ""}
          </Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={onGoAdd} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.bg} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuOpen(true)} style={styles.menuBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={exportCurrent}>
              <Text style={styles.menuItemText}>Export to Excel</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={doBackup}>
              <Text style={styles.menuItemText}>Backup Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={doRestore}>
              <Text style={styles.menuItemText}>Restore Data</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onGoChangeLock();
              }}
            >
              <Text style={styles.menuItemText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search name, diagnosis, notes, MRN..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={runSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
        {isSearching && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearSearch}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {STATUS_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, statusFilter === opt.key && styles.chipActive]}
            onPress={() => setStatusFilter(opt.key)}
          >
            <Text style={[styles.chipText, statusFilter === opt.key && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.sortBtn} onPress={cycleSort}>
          <Text style={styles.sortBtnText}>Sort: {SORT_LABELS[sortBy]}</Text>
        </TouchableOpacity>
      </View>

      {!isSearching && (
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthLabel(year, month)}</Text>
          <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.monthArrow}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.stay_id)}
        contentContainerStyle={{ paddingBottom: 24 }}
        stickySectionHeadersEnabled
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>
              {isSearching ? "No matching records found" : "No records for this filter"}
            </Text>
            {!isSearching && (
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onGoAdd}>
                <Text style={styles.emptyAddBtnText}>+ Add a record</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              {sortBy === "date" ? formatDateHeader(section.title) : `Sorted by ${SORT_LABELS[sortBy]}`}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => onOpenDetail(item.stay_id)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.first_name?.[0]}
                {item.last_name?.[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardName}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={styles.cardSub}>{item.primary_diagnosis}</Text>
              <Text style={styles.cardMrn}>
                MRN {item.mrn}{item.discharge_date ? "" : " · Admitted"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
          </TouchableOpacity>
        )}
      />
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
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "700" },
  topBarSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  topBarActions: { flexDirection: "row", alignItems: "center" },
  addBtn: {
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: colors.bg, fontSize: 18, fontWeight: "800", marginTop: -2 },
  menuBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuBtnText: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: -6 },
  menuBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  menuCard: {
    position: "absolute",
    top: 96,
    right: 20,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    minWidth: 200,
  },
  menuItem: { paddingVertical: 13, paddingHorizontal: 18 },
  menuItemText: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  menuDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  searchRow: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  searchBtnText: { color: colors.bg, fontWeight: "700" },
  clearBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearBtnText: { color: colors.textSecondary, fontWeight: "700" },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: colors.primary },
  sortBtn: {
    marginLeft: "auto",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortBtnText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
    gap: 20,
  },
  monthArrow: { paddingHorizontal: 14, paddingVertical: 4 },
  monthArrowText: { color: colors.primary, fontSize: 22, fontWeight: "700" },
  monthLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: "700", minWidth: 160, textAlign: "center" },
  sectionHeader: {
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  emptyWrap: { alignItems: "center", marginTop: 48 },
  empty: { textAlign: "center", color: colors.textMuted },
  emptyAddBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 18, backgroundColor: colors.primaryDim, borderRadius: radii.md },
  emptyAddBtnText: { color: colors.primary, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  cardName: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  cardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardMrn: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: 4 },
});
