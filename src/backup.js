import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { exportAllData, restoreAllData } from "./db";

export async function backupToFile() {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const uri = FileSystem.documentDirectory + `hospital_backup_${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(uri, json);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Save Backup",
    });
  }
  return uri;
}

// Returns { patientCount, stayCount } on success, or null if the user cancelled.
export async function restoreFromFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "*/*"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;

  const uri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(uri);
  const data = JSON.parse(content);

  if (!Array.isArray(data.patients) || !Array.isArray(data.hospital_stays)) {
    throw new Error("This file doesn't look like a valid Hospital Records backup.");
  }

  await restoreAllData(data);
  return { patientCount: data.patients.length, stayCount: data.hospital_stays.length };
}
