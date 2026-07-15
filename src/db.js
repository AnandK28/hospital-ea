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

  const count = await db.getFirstAsync("SELECT COUNT(*) as c FROM patients");
  if (count.c === 0) {
    await seedDemoData(db);
  }

  const lock = await db.getFirstAsync("SELECT value FROM app_meta WHERE key = ?", ["lock"]);
  if (!lock) {
    await db.runAsync("INSERT INTO app_meta (key, value) VALUES (?, ?)", [
      "lock",
      JSON.stringify({ type: "pin", value: "1234" }),
    ]);
  }
}

async function seedDemoData(db) {
  const patients = [
    ["Anjali", "Krishnan", "1988-04-12", "MRN-1001"],
    ["Ravi", "Subramaniam", "1975-11-02", "MRN-1002"],
    ["Meera", "Natarajan", "1993-07-21", "MRN-1003"],
  ];
  for (const p of patients) {
    await db.runAsync(
      "INSERT INTO patients (first_name, last_name, dob, mrn) VALUES (?, ?, ?, ?)",
      p
    );
  }

  const stays = [
    [1, "2026-06-01 09:00", "2026-06-05 14:00", "Community-acquired pneumonia",
      "Day1: febrile, started IV antibiotics.\nDay2: improving, O2 weaned.",
      "Admitted with fever and cough, treated with IV ceftriaxone, responded well.",
      "IV ceftriaxone 1g OD, supportive O2 therapy",
      "Afebrile, ambulatory, saturating well on room air",
      "Complete oral antibiotics, review in OPD after 1 week, return if fever recurs"],
    [2, "2026-06-10 11:00", "2026-06-12 10:00", "Acute gastroenteritis",
      "Day1: dehydrated, IV fluids started.",
      "Presented with vomiting and diarrhea, rehydrated, symptoms resolved.",
      "IV fluids, ondansetron, oral rehydration",
      "Stable, tolerating oral fluids",
      "Continue ORS, bland diet, follow up if symptoms recur"],
    [3, "2026-06-20 08:30", null, "Type 2 diabetes mellitus - uncontrolled",
      "Day1: blood sugar 340, insulin sliding scale started.",
      "Admitted for glycemic control, ongoing insulin titration.",
      "Insulin sliding scale, dietary counseling",
      "Under observation",
      "Pending discharge"],
  ];
  for (const s of stays) {
    await db.runAsync(
      `INSERT INTO hospital_stays
       (patient_id, admission_date, discharge_date, primary_diagnosis,
        daily_progress_notes, hospital_course, treatment_given,
        discharge_condition, discharge_advice)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      s
    );
  }
}

export async function searchPatients(query) {
  const db = await getDb();
  const like = `%${query}%`;
  return db.getAllAsync(
    `SELECT p.patient_id, p.first_name, p.last_name, p.mrn, p.dob,
            s.stay_id, s.primary_diagnosis, s.admission_date, s.discharge_date
     FROM patients p
     JOIN hospital_stays s ON p.patient_id = s.patient_id
     WHERE p.first_name LIKE ? COLLATE NOCASE
        OR p.last_name LIKE ? COLLATE NOCASE
        OR s.primary_diagnosis LIKE ? COLLATE NOCASE
     ORDER BY s.admission_date DESC`,
    [like, like, like]
  );
}

export async function getStayDetail(stayId) {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT p.first_name, p.last_name, p.mrn, p.dob, s.*
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
