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
      patient_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name   TEXT NOT NULL,
      last_name    TEXT NOT NULL,
      mrn          TEXT UNIQUE NOT NULL,
      rch_id       TEXT,
      phone_number TEXT,
      address      TEXT,
      vhn_name     TEXT,
      vhn_number   TEXT
    );

    CREATE TABLE IF NOT EXISTS hospital_stays (
      stay_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id          INTEGER REFERENCES patients(patient_id),
      admission_date       TEXT,
      discharge_date       TEXT,
      primary_diagnosis    TEXT NOT NULL,
      hospital_course      TEXT,
      discharge_condition  TEXT
    );

    CREATE TABLE IF NOT EXISTS medications (
      medication_id INTEGER PRIMARY KEY AUTOINCREMENT,
      stay_id       INTEGER REFERENCES hospital_stays(stay_id) ON DELETE CASCADE,
      drug_name     TEXT NOT NULL,
      frequency     TEXT,
      duration      TEXT,
      sort_order    INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS investigations (
      entry_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      stay_id    INTEGER REFERENCES hospital_stays(stay_id) ON DELETE CASCADE,
      entry_date TEXT NOT NULL,
      notes      TEXT,
      hb TEXT, pcv TEXT, plt TEXT, tc TEXT, dc TEXT, pt TEXT, inr TEXT, aptt TEXT,
      rbs TEXT, tb TEXT, sgot TEXT, sgpt TEXT, ldh TEXT, urea TEXT, creat TEXT, na TEXT, k TEXT,
      usg TEXT, echo TEXT, tsh TEXT, ogct TEXT,
      glyc_3am TEXT, glyc_fasting TEXT, glyc_post_prandial TEXT,
      glyc_pre_lunch TEXT, glyc_post_lunch TEXT, glyc_pre_dinner TEXT, glyc_post_dinner TEXT
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `);

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
  p.patient_id, p.first_name, p.last_name, p.mrn, p.rch_id, p.phone_number,
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
        OR p.rch_id LIKE ? COLLATE NOCASE
        OR p.phone_number LIKE ? COLLATE NOCASE
        OR p.address LIKE ? COLLATE NOCASE
        OR p.vhn_name LIKE ? COLLATE NOCASE
        OR s.primary_diagnosis LIKE ? COLLATE NOCASE
        OR s.hospital_course LIKE ? COLLATE NOCASE
        OR s.discharge_condition LIKE ? COLLATE NOCASE
     ORDER BY s.admission_date DESC`,
    Array(10).fill(like)
  );
}

export async function getStayDetail(stayId) {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT p.patient_id, p.first_name, p.last_name, p.mrn, p.rch_id, p.phone_number,
            p.address, p.vhn_name, p.vhn_number, s.*
     FROM hospital_stays s
     JOIN patients p ON p.patient_id = s.patient_id
     WHERE s.stay_id = ?`,
    [stayId]
  );
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

export async function addPatientAndStay(data, medications) {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO patients (first_name, last_name, mrn, rch_id, phone_number, address, vhn_name, vhn_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      data.first_name, data.last_name, data.mrn, data.rch_id || "",
      data.phone_number || "", data.address || "", data.vhn_name || "", data.vhn_number || "",
    ]
  );
  const patientId = result.lastInsertRowId;
  const stayResult = await db.runAsync(
    `INSERT INTO hospital_stays
     (patient_id, admission_date, discharge_date, primary_diagnosis, hospital_course, discharge_condition)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      patientId, data.admission_date || null, data.discharge_date || null,
      data.primary_diagnosis, data.hospital_course || "", data.discharge_condition || "",
    ]
  );
  const stayId = stayResult.lastInsertRowId;
  await saveMedications(stayId, medications || []);
  return stayId;
}

export async function updatePatientAndStay(stayId, patientId, data, medications) {
  const db = await getDb();
  await db.runAsync(
    "UPDATE patients SET first_name = ?, last_name = ?, mrn = ?, rch_id = ?, phone_number = ?, address = ?, vhn_name = ?, vhn_number = ? WHERE patient_id = ?",
    [
      data.first_name, data.last_name, data.mrn, data.rch_id || "",
      data.phone_number || "", data.address || "", data.vhn_name || "", data.vhn_number || "",
      patientId,
    ]
  );
  await db.runAsync(
    `UPDATE hospital_stays SET
       admission_date = ?, discharge_date = ?, primary_diagnosis = ?,
       hospital_course = ?, discharge_condition = ?
     WHERE stay_id = ?`,
    [
      data.admission_date || null, data.discharge_date || null, data.primary_diagnosis,
      data.hospital_course || "", data.discharge_condition || "", stayId,
    ]
  );
  if (medications) {
    await saveMedications(stayId, medications);
  }
}

export async function deleteStay(stayId, patientId) {
  const db = await getDb();
  await db.runAsync("DELETE FROM medications WHERE stay_id = ?", [stayId]);
  await db.runAsync("DELETE FROM investigations WHERE stay_id = ?", [stayId]);
  await db.runAsync("DELETE FROM hospital_stays WHERE stay_id = ?", [stayId]);
  const remaining = await db.getFirstAsync(
    "SELECT COUNT(*) as c FROM hospital_stays WHERE patient_id = ?",
    [patientId]
  );
  if (remaining.c === 0) {
    await db.runAsync("DELETE FROM patients WHERE patient_id = ?", [patientId]);
  }
}

// ---------- Medications ----------

export async function getMedications(stayId) {
  const db = await getDb();
  return db.getAllAsync(
    "SELECT * FROM medications WHERE stay_id = ? ORDER BY sort_order ASC, medication_id ASC",
    [stayId]
  );
}

export async function saveMedications(stayId, medications) {
  const db = await getDb();
  await db.runAsync("DELETE FROM medications WHERE stay_id = ?", [stayId]);
  let order = 0;
  for (const m of medications) {
    if (!m.drug_name || !m.drug_name.trim()) continue;
    await db.runAsync(
      "INSERT INTO medications (stay_id, drug_name, frequency, duration, sort_order) VALUES (?, ?, ?, ?, ?)",
      [stayId, m.drug_name.trim(), m.frequency || "", m.duration || "", order]
    );
    order += 1;
  }
}

// ---------- Investigations (daily log) ----------

export async function getInvestigations(stayId) {
  const db = await getDb();
  return db.getAllAsync(
    "SELECT * FROM investigations WHERE stay_id = ? ORDER BY entry_date ASC, entry_id ASC",
    [stayId]
  );
}

export async function getInvestigationEntry(entryId) {
  const db = await getDb();
  return db.getFirstAsync("SELECT * FROM investigations WHERE entry_id = ?", [entryId]);
}

const INVESTIGATION_FIELDS = [
  "hb", "pcv", "plt", "tc", "dc", "pt", "inr", "aptt",
  "rbs", "tb", "sgot", "sgpt", "ldh", "urea", "creat", "na", "k",
  "usg", "echo", "tsh", "ogct",
  "glyc_3am", "glyc_fasting", "glyc_post_prandial",
  "glyc_pre_lunch", "glyc_post_lunch", "glyc_pre_dinner", "glyc_post_dinner",
];

export async function addInvestigationEntry(stayId, data) {
  const db = await getDb();
  const cols = ["stay_id", "entry_date", "notes", ...INVESTIGATION_FIELDS];
  const placeholders = cols.map(() => "?").join(", ");
  const values = [stayId, data.entry_date, data.notes || "", ...INVESTIGATION_FIELDS.map((f) => data[f] || "")];
  await db.runAsync(
    `INSERT INTO investigations (${cols.join(", ")}) VALUES (${placeholders})`,
    values
  );
}

export async function updateInvestigationEntry(entryId, data) {
  const db = await getDb();
  const setClause = ["entry_date = ?", "notes = ?", ...INVESTIGATION_FIELDS.map((f) => `${f} = ?`)].join(", ");
  const values = [data.entry_date, data.notes || "", ...INVESTIGATION_FIELDS.map((f) => data[f] || ""), entryId];
  await db.runAsync(`UPDATE investigations SET ${setClause} WHERE entry_id = ?`, values);
}

export async function deleteInvestigationEntry(entryId) {
  const db = await getDb();
  await db.runAsync("DELETE FROM investigations WHERE entry_id = ?", [entryId]);
}

// ---------- Backup / restore ----------

export async function exportAllData() {
  const db = await getDb();
  const patients = await db.getAllAsync("SELECT * FROM patients");
  const hospital_stays = await db.getAllAsync("SELECT * FROM hospital_stays");
  const medications = await db.getAllAsync("SELECT * FROM medications");
  const investigations = await db.getAllAsync("SELECT * FROM investigations");
  return { patients, hospital_stays, medications, investigations, exported_at: new Date().toISOString(), version: 2 };
}

export async function restoreAllData(data) {
  const db = await getDb();
  await db.execAsync(`
    DELETE FROM investigations; DELETE FROM medications;
    DELETE FROM hospital_stays; DELETE FROM patients;
  `);
  for (const p of data.patients || []) {
    await db.runAsync(
      "INSERT INTO patients (patient_id, first_name, last_name, mrn, rch_id, phone_number, address, vhn_name, vhn_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [p.patient_id, p.first_name, p.last_name, p.mrn, p.rch_id, p.phone_number, p.address, p.vhn_name, p.vhn_number]
    );
  }
  for (const s of data.hospital_stays || []) {
    await db.runAsync(
      `INSERT INTO hospital_stays
       (stay_id, patient_id, admission_date, discharge_date, primary_diagnosis, hospital_course, discharge_condition)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.stay_id, s.patient_id, s.admission_date, s.discharge_date, s.primary_diagnosis, s.hospital_course, s.discharge_condition]
    );
  }
  for (const m of data.medications || []) {
    await db.runAsync(
      "INSERT INTO medications (medication_id, stay_id, drug_name, frequency, duration, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
      [m.medication_id, m.stay_id, m.drug_name, m.frequency, m.duration, m.sort_order]
    );
  }
  for (const inv of data.investigations || []) {
    const cols = ["entry_id", "stay_id", "entry_date", "notes", ...INVESTIGATION_FIELDS];
    const placeholders = cols.map(() => "?").join(", ");
    await db.runAsync(
      `INSERT INTO investigations (${cols.join(", ")}) VALUES (${placeholders})`,
      cols.map((c) => inv[c])
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
