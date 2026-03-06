# Setup Guide

This guide covers getting the DDD Timetable app running on your machine and deploying it to a physical Android or iOS device.

## Prerequisites

### Required for everything

- **Bun** — the JavaScript runtime used for both the backend and mobile app.

### Required for Android

- **Android Studio** — download from [developer.android.com/studio](https://developer.android.com/studio) or via your package manager.
- During first launch, complete the setup wizard — it will download the Android SDK automatically.


- If on linux, add to your shell profile (`~/.zshrc` or `~/.bashrc`):
  ```sh
  export ANDROID_HOME="$HOME/Android/Sdk"
  export PATH="$ANDROID_HOME/platform-tools:$PATH"
  export CAPACITOR_ANDROID_STUDIO_PATH=/path/to/android-studio/bin/studio.sh
  ```

### Required for iOS

- **Xcode** — macOS only, install from the App Store.
- **Xcode Command Line Tools**: `xcode-select --install`

---

## 1. Clone and install

**macOS/Linux:**
```sh
git clone https://github.com/UOH-CS-Level5/group-project-repo-2025-2026-roshan-c.git
cd group-project-repo-2025-2026-roshan-c
cd packages/icalapp/backend && bun install
cd ../../../apps/icalapp/mobile && bun install
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/UOH-CS-Level5/group-project-repo-2025-2026-roshan-c.git
cd group-project-repo-2025-2026-roshan-c
cd packages/icalapp/backend; bun install
cd ../../../apps/icalapp/mobile; bun install
```

---

## 2. Run the backend

```sh
cd packages/icalapp/backend
bun run dev
```

The backend starts on port 3000. Verify it's working by visiting `http://localhost:3000/api/health` in your browser — it should return `{"ok":true}`.

---

## 3. Deploy to Android

```sh
cd apps/icalapp/mobile
bun run android:open
```

This builds the web app, syncs it into the Android project, and opens Android Studio. From there:

1. Wait for Gradle to finish indexing (progress bar at the bottom).
2. Connect your Android phone via USB with **USB Debugging** enabled (Settings → Developer Options → USB Debugging).
3. Your device should appear in the device selector at the top.
4. Click **Run** (the green play button).

The app will be installed and launched on your phone.

> **Note:** Each time you change the frontend code, re-run `bun run android:open` to sync the changes, then click Run in Android Studio again.

---

## 4. Deploy to iOS

```sh
cd apps/icalapp/mobile
bun run ios:open
```

This builds the web app, syncs it into the iOS project, and opens Xcode. From there:

1. Connect your iPhone via USB.
2. Select your device in the scheme selector at the top.
3. You may need to set a **Development Team** under the project's Signing & Capabilities settings.
4. Click **Run** (the play button).

---
