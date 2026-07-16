import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export async function exportRowsToExcel(rows, filename) {
  const headers = [
    "Patient ID", "First Name", "Last Name", "MRN", "RCH ID", "Phone Number",
    "Stay ID", "Diagnosis", "Date of Admission", "Date of Discharge",
  ];
  const data = rows.map((r) => [
    r.patient_id, r.first_name, r.last_name, r.mrn, r.rch_id, r.phone_number,
    r.stay_id, r.primary_diagnosis, r.admission_date, r.discharge_date,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 14) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Patient Records");
  const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });

  const name = filename || `patient_export_${Date.now()}.xlsx`;
  const uri = FileSystem.documentDirectory + name;
  await FileSystem.writeAsStringAsync(uri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Export Patient Records",
      UTI: "com.microsoft.excel.xlsx",
    });
  }
  return uri;
}
