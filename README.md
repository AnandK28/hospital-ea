# Hospital Records (Expo / React Native)

Search patients/diagnoses, view full stay details, add records, export to
Excel, and a PIN-or-pattern lock screen. Data lives entirely on-device in
SQLite (`src/db.js`) — nothing is uploaded anywhere. EAS Build only compiles
your source code into an APK; it never sees or stores your data.

## Building the APK — entirely from your phone

You don't need a laptop or Android Studio for any of this.

1. **Install Termux** or use **GitHub Codespaces** (browser-based Linux
   terminal) — Codespaces is simplest since it needs no phone storage setup.
   On your repo page: green **Code** button → **Codespaces** tab →
   **Create codespace on main**.

2. In the Codespaces terminal:
   ```bash
   npm install -g eas-cli
   npm install
   npx eas login
   ```
   (Create a free Expo account at expo.dev first if you don't have one —
   you can sign up right in that login prompt.)

3. Start the build:
   ```bash
   npx eas build --platform android --profile preview
   ```
   This uploads your code to Expo's build servers and compiles it there —
   you'll see a build URL in the terminal. It takes about 10–15 minutes.

4. When it finishes, the terminal (and the expo.dev build page) gives you a
   direct **download link** for the `.apk`. Open that link on your phone,
   download, and install (allow "install from unknown sources" if prompted).

## Trying it before building
```bash
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app (from the Play Store) to preview
the app live on your phone without building anything — great for checking
the UI/logic quickly.

## Notes / next steps
- Default lock is a **pattern** (S-shape: 1-2-3-6-5-4-7-8-9). Change it via
  the ⋮ menu → Change Password on the home screen (PIN or pattern, your choice).
- **Backup Data** (⋮ menu) exports all records to a JSON file via the share
  sheet — save it to Drive, email it to yourself, etc. **Restore Data**
  loads a backup back in (replaces current records — confirmation required).
- Individual records export as **PDF** (from the detail screen); the current
  filtered/visible list exports as **Excel** (from the ⋮ menu).
- Home screen groups records by day, with a month switcher, filter chips
  (All/Admitted/Discharged), and a cycling sort button (Date/Name/Diagnosis).
- All icons are vector icons via `@expo/vector-icons` (Ionicons) — no emoji
  anywhere in the UI.
- New native dependencies added since the first build:
  `@expo/vector-icons`, `@react-native-community/datetimepicker`,
  `expo-print`, `expo-document-picker`. Run `npx expo install --fix` after
  `npm install` to align versions with your Expo SDK before building.
- No demo data is seeded — the app starts empty.
- 3 demo patients are seeded on first launch.
