import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert,
} from "react-native";
import { searchPatients } from "../db";
import { exportRowsToExcel } from "../exportExcel";
import { colors, radii } from "../theme";

export default function SearchScreen({ onOpenDetail, onGoAdd, onGoChangeLock }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) {
      Alert.alert("Type a name or diagnosis to search");
      return;
    }
    const rows = await searchPatients(query.trim());
    setResults(rows);
    setSearched(true);
  };

  const exportAll = async () => {
    if (results.length === 0) {
      Alert.alert("Run a search first, then export");
      return;
    }
    await exportRowsToExcel(results);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarTitle}>Hospital Records</Text>
          <Text style={styles.topBarSub}>Patient search</Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity onPress={onGoChangeLock} style={styles.iconBtn}>
            <Text style={styles.iconText}>🔑</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={exportAll} style={styles.iconBtn}>
            <Text style={styles.iconText}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onGoAdd} style={[styles.iconBtn, styles.addBtn]}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by name or diagnosis"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={runSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.stay_id)}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        ListEmptyComponent={
          searched ? (
            <Text style={styles.empty}>No matching records found</Text>
          ) : (
            <Text style={styles.hint}>Search results will appear here</Text>
          )
        }
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
              <Text style={styles.cardMrn}>MRN {item.mrn}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
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
    paddingBottom: 20,
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
  iconBtn: { marginLeft: 12, padding: 4 },
  iconText: { fontSize: 19 },
  addBtn: {
    backgroundColor: colors.primary,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },
  addBtnText: { color: colors.bg, fontSize: 18, fontWeight: "800", marginTop: -2 },
  searchRow: {
    flexDirection: "row",
    padding: 16,
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
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 48 },
  hint: { textAlign: "center", color: colors.textMuted, marginTop: 48 },
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
