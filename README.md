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

## Notes
- Default PIN is `1234` — change it via the key icon on the search screen
  (lets you switch between PIN and pattern lock).
- Excel exports are saved to the app's private storage and immediately
  opened in the native share sheet, so you can save them to Google Drive,
  WhatsApp, email, etc.
- 3 demo patients are seeded on first launch.
