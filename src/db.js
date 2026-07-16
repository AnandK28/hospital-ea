import * as SQLite from "expo-sqlite";

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("hospital.db");
  }
  return dbPromise;
}

export async function initDb() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS patients (
      patient_id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name  TEXT NOT NULL,
      dob        TEXT NOT NULL,
      mrn        TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hospital_stays (
      stay_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id          INTEGER REFERENCES patients(patient_id),
      admission_date       TEXT DEFAULT CURRENT_TIMESTAMP,
      discharge_date       TEXT,
      primary_diagnosis    TEXT NOT NULL,
      daily_progress_notes TEXT,
      hospital_course      TEXT,
      treatment_given      TEXT,
      discharge_condition  TEXT,
      discharge_advice     TEXT
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // No demo data is seeded — the app starts empty, ready for real records.
  const lock = await db.getFirstAsync("SELECT value FROM app_meta WHERE key = ?", ["lock"]);
  if (!lock) {
    // Default lock: pattern connecting dots 3-2-1-4-5-6-9-8-7
    // (0-indexed grid positions: 2-1-0-3-4-5-8-7-6)
    await db.runAsync("INSERT INTO app_meta (key, value) VALUES (?, ?)", [
      "lock",
      JSON.stringify({ type: "pattern", value: "2-1-0-3-4-5-8-7-6" }),
    ]);
  }
}

const LIST_COLUMNS = `
  p.patient_id, p.first_name, p.last_name, p.mrn, p.dob,
  s.stay_id, s.primary_diagnosis, s.admission_date, s.discharge_date
`;

export async function getAllStays() {
  const db = await getDb();
  return db.getAllAsync(`
    SELECT ${LIST_COLUMNS}
    FROM patients p
    JOIN hospital_stays s ON p.patient_id = s.patient_id
    ORDER BY s.admission_date DESC
  `);
}

export async function getStaysForMonth(year, month) {
  // month is 1-12
  const db = await getDb();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return db.getAllAsync(
    `SELECT ${LIST_COLUMNS}
     FROM patients p
     JOIN hospital_stays s ON p.patient_id = s.patient_id
     WHERE s.admission_date LIKE ?
     ORDER BY s.admission_date DESC`,
    [`${prefix}%`]
  );
}

export async function getAvailableMonths() {
  const db = await getDb();
  const rows = await db.getAllAsync(`
    SELECT DISTINCT substr(admission_date, 1, 7) as ym
    FROM hospital_stays
    WHERE admission_date IS NOT NULL
    ORDER BY ym DESC
  `);
  return rows.map((r) => r.ym); // ["2026-07", "2026-06", ...]
}

export async function searchPatients(query) {
  const db = await getDb();
  const like = `%${query}%`;
  return db.getAllAsync(
    `SELECT ${LIST_COLUMNS}
     FROM patients p
     JOIN hospital_stays s ON p.patient_id = s.patient_id
     WHERE p.first_name LIKE ? COLLATE NOCASE
        OR p.last_name LIKE ? COLLATE NOCASE
        OR p.mrn LIKE ? COLLATE NOCASE
        OR s.primary_diagnosis LIKE ? COLLATE NOCASE
        OR s.daily_progress_notes LIKE ? COLLATE NOCASE
        OR s.hospital_course LIKE ? COLLATE NOCASE
        OR s.treatment_given LIKE ? COLLATE NOCASE
        OR s.discharge_condition LIKE ? COLLATE NOCASE
        OR s.discharge_advice LIKE ? COLLATE NOCASE
     ORDER BY s.admission_date DESC`,
    [like, like, like, like, like, like, like, like, like]
  );
}

export async function getStayDetail(stayId) {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT p.patient_id, p.first_name, p.last_name, p.mrn, p.dob, s.*
     FROM hospital_stays s
     JOIN patients p ON p.patient_id = s.patient_id
     WHERE s.stay_id = ?`,
    [stayId]
  );
}

export async function addPatientAndStay(data) {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO patients (first_name, last_name, dob, mrn) VALUES (?, ?, ?, ?)",
    [data.first_name, data.last_name, data.dob, data.mrn]
  );
  const patientId = result.lastInsertRowId;
  await db.runAsync(
    `INSERT INTO hospital_stays
     (patient_id, primary_diagnosis, daily_progress_notes, hospital_course,
      treatment_given, discharge_condition, discharge_advice)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      patientId,
      data.primary_diagnosis,
      data.daily_progress_notes || "",
      data.hospital_course || "",
      data.treatment_given || "",
      data.discharge_condition || "",
      data.discharge_advice || "",
    ]
  );
}

export async function updatePatientAndStay(stayId, patientId, data) {
  const db = await getDb();
  await db.runAsync(
    "UPDATE patients SET first_name = ?, last_name = ?, dob = ?, mrn = ? WHERE patient_id = ?",
    [data.first_name, data.last_name, data.dob, data.mrn, patientId]
  );
  await db.runAsync(
    `UPDATE hospital_stays SET
       primary_diagnosis = ?, daily_progress_notes = ?, hospital_course = ?,
       treatment_given = ?, discharge_condition = ?, discharge_advice = ?
     WHERE stay_id = ?`,
    [
      data.primary_diagnosis,
      data.daily_progress_notes || "",
      data.hospital_course || "",
      data.treatment_given || "",
      data.discharge_condition || "",
      data.discharge_advice || "",
      stayId,
    ]
  );
}

export async function deleteStay(stayId, patientId) {
  const db = await getDb();
  await db.runAsync("DELETE FROM hospital_stays WHERE stay_id = ?", [stayId]);
  // if this patient has no other stays left, remove the patient record too
  const remaining = await db.getFirstAsync(
    "SELECT COUNT(*) as c FROM hospital_stays WHERE patient_id = ?",
    [patientId]
  );
  if (remaining.c === 0) {
    await db.runAsync("DELETE FROM patients WHERE patient_id = ?", [patientId]);
  }
}

export async function getStaysForPatient(patientId, excludeStayId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT stay_id, admission_date, discharge_date, primary_diagnosis
     FROM hospital_stays
     WHERE patient_id = ? AND stay_id != ?
     ORDER BY admission_date DESC`,
    [patientId, excludeStayId]
  );
}

export async function isMrnTaken(mrn, excludePatientId) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    "SELECT patient_id FROM patients WHERE mrn = ? AND patient_id != ?",
    [mrn, excludePatientId || -1]
  );
  return !!row;
}

export async function exportAllData() {
  const db = await getDb();
  const patients = await db.getAllAsync("SELECT * FROM patients");
  const hospital_stays = await db.getAllAsync("SELECT * FROM hospital_stays");
  return { patients, hospital_stays, exported_at: new Date().toISOString(), version: 1 };
}

export async function restoreAllData(data) {
  const db = await getDb();
  await db.execAsync("DELETE FROM hospital_stays; DELETE FROM patients;");
  for (const p of data.patients || []) {
    await db.runAsync(
      "INSERT INTO patients (patient_id, first_name, last_name, dob, mrn) VALUES (?, ?, ?, ?, ?)",
      [p.patient_id, p.first_name, p.last_name, p.dob, p.mrn]
    );
  }
  for (const s of data.hospital_stays || []) {
    await db.runAsync(
      `INSERT INTO hospital_stays
       (stay_id, patient_id, admission_date, discharge_date, primary_diagnosis,
        daily_progress_notes, hospital_course, treatment_given,
        discharge_condition, discharge_advice)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.stay_id, s.patient_id, s.admission_date, s.discharge_date, s.primary_diagnosis,
        s.daily_progress_notes, s.hospital_course, s.treatment_given,
        s.discharge_condition, s.discharge_advice,
      ]
    );
  }
}

export async function getLock() {
  const db = await getDb();
  const row = await db.getFirstAsync("SELECT value FROM app_meta WHERE key = ?", ["lock"]);
  return JSON.parse(row.value);
}

export async function setLock(type, value) {
  const db = await getDb();
  await db.runAsync("UPDATE app_meta SET value = ? WHERE key = ?", [
    JSON.stringify({ type, value }),
    "lock",
  ]);
}
