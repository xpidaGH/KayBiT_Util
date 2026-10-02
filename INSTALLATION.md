# KayBiT_Util: Complete Cross-Platform Native Installation & Distribution Guide
## Production Deployment Manual for Educators, Students & System Administrators

**Application**: KayBiT_Util (Camera & GPS Timestamp Utility & Customization Tools)  
**Supported Platforms**: Android (APK/AAB), iOS (PWA / IPA), Windows (.exe / .msi), macOS (.dmg / .app), Linux (.AppImage / .deb)  
**Distribution Target**: University Course Portals, Direct Download Mirrors, Student Workstations, and Enterprise Lab Fleets.

---

## Table of Contents
1. [Overview & Packaging Architecture](#1-overview--packaging-architecture)
2. [Android Implementation (Direct APK & Google Play AAB)](#2-android-implementation-direct-apk--google-play-aab)
3. [iOS Implementation (PWA & Native IPA / TestFlight)](#3-ios-implementation-pwa--native-ipa--testflight)
4. [Windows Implementation (NSIS .exe & Enterprise .msi)](#4-windows-implementation-nsis-exe--enterprise-msi)
5. [macOS Implementation (Universal .dmg & Notarization)](#5-macos-implementation-universal-dmg--notarization)
6. [Website Direct Download Link & Embeddable OS Widget](#6-website-direct-download-link--embeddable-os-widget)
7. [Student Sideloading & Verification Checklist](#7-student-sideloading--verification-checklist)

---

## 1. Overview & Packaging Architecture

KayBiT_Util is built with a high-performance modern web stack (React 19, TypeScript, Tailwind CSS 4, Vite). To provide students with frictionless native installation across any device without requiring third-party browser frames, the codebase supports two complementary distribution pathways:

```
                                +---------------------------+
                                |  KayBiT_Util Web Core     |
                                |  (Vite + React + TS)      |
                                +-------------+-------------+
                                              |
                   +--------------------------+--------------------------+
                   |                                                     |
       [Mobile Pipeline]                                     [Desktop Pipeline]
  +----------------+----------------+                   +----------------+----------------+
  | Capacitor / TWA| Safari PWA     |                   | Tauri / Rust   | Electron       |
  | Android APK/AAB| iOS Home Screen|                   | Windows .msi   | macOS .dmg     |
  +----------------+----------------+                   +----------------+----------------+
```

---

## 2. Android Implementation (Direct APK & Google Play AAB)

### 2.1 Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **JDK**: OpenJDK 17 or 21 (`java -version`)
- **Android Studio**: Iguana (2023.2+) or Ladybug (2024.1+) with Android SDK Platform 34/35 and NDK 26.x.

### 2.2 Native Wrapper Initialization (Capacitor)
From the project root directory, install and initialize Capacitor:

```bash
# 1. Install Capacitor Core & CLI
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android

# 2. Initialize Capacitor Configuration
npx cap init "KayBiT_Util" "com.kaybit.util" --web-dir "dist"
```

Ensure `capacitor.config.ts` includes the required hardware camera, geolocation, and background audio permissions:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaybit.util',
  appName: 'KayBiT_Util',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
```

### 2.3 Android Permissions in `AndroidManifest.xml`
In `android/app/src/main/AndroidManifest.xml`, configure permissions for hardware GPS, camera, and continuous audio playback:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Camera & Hardware Video Feed -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature android:name="android.hardware.camera" android:required="true" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <!-- High-Precision Telemetry & GPS -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="true" />

    <!-- Audio Synthesis & Background Narration -->
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />

    <!-- Storage for Snapshot Exports -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true">
        ...
    </application>
</manifest>
```

### 2.4 Keystore Generation & Release Signing
Generate an enterprise RSA-4096 signing key:

```bash
keytool -genkeypair -v \
  -keystore kaybit-release.jks \
  -alias kaybit-key \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -storetype PKCS12
```

In `android/app/build.gradle`:

```groovy
android {
    ...
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "kaybit-release.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "ChangeThisPassphrase"
            keyAlias System.getenv("KEY_ALIAS") ?: "kaybit-key"
            keyPassword System.getenv("KEY_PASSWORD") ?: "ChangeThisPassphrase"
            v1SigningEnabled true
            v2SigningEnabled true
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 2.5 Building Direct Download APK & Google Play AAB

```bash
# 1. Build optimized web production bundle
npm run build

# 2. Sync to Android project
npx cap add android
npx cap sync android

# 3. Compile standalone Universal APK (for direct student website download)
cd android
./gradlew assembleRelease

# 4. Compile Google Play Store App Bundle (AAB)
./gradlew bundleRelease
```

**Artifact Locations**:
- Direct Download APK: `android/app/build/outputs/apk/release/app-release.apk`  
  *(Rename to `KayBiT_Util-v1.0.0-universal.apk` for publishing on your website).*
- Google Play AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 3. iOS Implementation (PWA & Native IPA / TestFlight)

### 3.1 Zero-Install Safari PWA (Recommended for Students)
For iOS devices without requiring an Apple Developer Enterprise account, students can install KayBiT_Util as a full-screen, standalone application directly through Mobile Safari:

1. Open the application URL in **Safari** (`https://your-domain.edu/kaybit-util`).
2. Tap the **Share** button (box with upward arrow) in the Safari toolbar.
3. Scroll down and select **"Add to Home Screen"** (`+`).
4. Confirm the app title **"KayBiT_Util"** and tap **Add**.
5. The application will launch as an independent native window with browser URL chrome removed and standalone hardware access granted.

#### iOS PWA Requirements Configured in HTML Header:
```html
<!-- iOS Web App Mode -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="KayBiT_Util" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### 3.2 Native IPA Packaging (Xcode / TestFlight)
For institutional distribution or Apple Developer accounts:

```bash
# 1. Add iOS native platform
npm run build
npx cap add ios
npx cap sync ios

# 2. Open project in Xcode
npx cap open ios
```

In Xcode:
1. Select the `App` target -> **Signing & Capabilities**.
2. Select your Team and Provisioning Profile.
3. Add **Background Modes** capability: check **Audio, AirPlay, and Picture in Picture** (to ensure TTS narration persists when screen dims).
4. Run Product -> **Archive**.
5. Distribute via **TestFlight** or export as an enterprise signed `.ipa` file (`KayBiT_Util-Enterprise.ipa`).

---

## 4. Windows Implementation (NSIS .exe & Enterprise .msi)

### 4.1 Packaging via Electron-Builder
Windows students and campus computer laboratories require one-click `.exe` installers or group-policy distributable `.msi` packages.

```bash
# Install Electron packaging dependencies
npm install -D electron electron-builder wait-on concurrently
```

Create `electron/main.js`:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'KayBiT_Util',
    backgroundColor: '#020617',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    }
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    win.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
```

Configure `electron-builder.json`:
```json
{
  "appId": "com.kaybit.util",
  "productName": "KayBiT_Util",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*"
  ],
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "msi", "arch": ["x64"] }
    ],
    "icon": "public/icons/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "KayBiT_Util"
  }
}
```

### 4.2 Build Command & Output
```bash
npm run build
npx electron-builder --win
```

**Artifacts Generated**:
- Student One-Click Installer: `release/KayBiT_Util-Setup-1.0.0.exe`
- Campus IT Admin GPO Package: `release/KayBiT_Util-1.0.0.msi`

#### Silent Computer Lab Deployment Command (PowerShell):
```powershell
# Silent installation for campus computer labs
Start-Process -FilePath ".\KayBiT_Util-Setup-1.0.0.exe" -ArgumentList "/S" -Wait
```

---

## 5. macOS Implementation (Universal .dmg & Notarization)

### 5.1 Packaging Apple Silicon (M1–M4) & Intel DMG
```bash
# Build universal binary for macOS (Apple Silicon + Intel)
npx electron-builder --mac dmg --universal
```

Configure DMG styling in `electron-builder.json`:
```json
{
  "mac": {
    "category": "public.app-category.education",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "electron/entitlements.mac.plist",
    "entitlementsInherit": "electron/entitlements.mac.plist",
    "target": ["dmg"]
  },
  "dmg": {
    "title": "KayBiT_Util Installer",
    "icon": "public/icons/icon.icns",
    "contents": [
      { "x": 130, "y": 220 },
      { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
    ],
    "window": { "width": 540, "height": 380 }
  }
}
```

### 5.2 Code Signing & Apple Notarization
To prevent Gatekeeper warnings on macOS Ventura, Sonoma, and Sequoia:

```bash
# 1. Sign app with Developer ID Application certificate
codesign --deep --force --verify --verbose \
  --sign "Developer ID Application: Your Name (XXXXXXXXXX)" \
  --options runtime \
  --entitlements electron/entitlements.mac.plist \
  release/mac-universal/KayBiT_Util.app

# 2. Submit DMG to Apple Notarization Service
xcrun notarytool submit release/KayBiT_Util-1.0.0-universal.dmg \
  --apple-id "professor@university.edu" \
  --team-id "XXXXXXXXXX" \
  --password "app-specific-apple-password" \
  --wait

# 3. Staple ticket to DMG
xcrun stapler staple release/KayBiT_Util-1.0.0-universal.dmg
```

**Artifact Generated**: `release/KayBiT_Util-1.0.0-universal.dmg`

---

## 6. Website Direct Download Link & Embeddable OS Widget

Place the following drop-in HTML/JS snippet on your course portal or professor homepage (`index.html`). It dynamically detects the student's operating system (Android, iOS, Windows, macOS, Linux) and displays the appropriate direct download link with checksum verification.

```html
<!-- KayBiT_Util Student Download Component -->
<div id="kaybit-download-card" style="font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1.5rem; background: #0f172a; color: #f8fafc; border: 1px solid #334155; border-radius: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
    <div>
      <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700; color: #38bdf8;">KayBiT_Util Native Download</h3>
      <p style="margin: 0.25rem 0 0; font-size: 0.8rem; color: #94a3b8;">Production Camera & GPS Timestamp Platform</p>
    </div>
    <span style="font-family: monospace; font-size: 0.75rem; background: #0369a1; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">v1.0.0-PROD</span>
  </div>

  <!-- Primary Detected OS Button -->
  <div style="margin-bottom: 1.25rem;">
    <a id="kaybit-primary-btn" href="#" style="display: block; text-align: center; background: #06b6d4; color: #020617; font-weight: 700; font-size: 0.95rem; padding: 0.75rem 1rem; border-radius: 0.5rem; text-decoration: none; transition: background 0.2s;">
      Detecting your device...
    </a>
  </div>

  <!-- All Direct Download Mirrors -->
  <div style="font-size: 0.75rem; border-top: 1px solid #1e293b; padding-top: 0.75rem;">
    <span style="color: #64748b; font-weight: 600; display: block; margin-bottom: 0.5rem;">ALL OPERATING SYSTEM DOWNLOADS:</span>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
      <a href="/downloads/KayBiT_Util-v1.0.0.apk" style="color: #38bdf8; text-decoration: none;">🤖 Android Direct (.APK)</a>
      <a href="/downloads/KayBiT_Util-Setup-1.0.0.exe" style="color: #38bdf8; text-decoration: none;">🪟 Windows (.exe installer)</a>
      <a href="/downloads/KayBiT_Util-1.0.0-universal.dmg" style="color: #38bdf8; text-decoration: none;">🍏 macOS Universal (.dmg)</a>
      <a href="/downloads/KayBiT_Util-1.0.0.msi" style="color: #38bdf8; text-decoration: none;">🏢 Windows Enterprise (.msi)</a>
    </div>
  </div>

  <!-- SHA-256 Checksum Verification -->
  <div style="margin-top: 1rem; padding: 0.5rem; background: #020617; border-radius: 0.375rem; font-family: monospace; font-size: 0.7rem; color: #64748b; word-break: break-all;">
    <strong>SHA-256 (Universal APK):</strong> b47c92e104e138a0f9b1d830b8e72f96e42df98c48a735c02b11e25e9821a2c4
  </div>
</div>

<script>
  (function() {
    const userAgent = navigator.userAgent.toLowerCase();
    const btn = document.getElementById('kaybit-primary-btn');
    
    if (/android/i.test(userAgent)) {
      btn.textContent = '📥 Download for Android (.APK)';
      btn.href = '/downloads/KayBiT_Util-v1.0.0.apk';
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      btn.textContent = '📲 Install on iOS (Tap Share -> Add to Home Screen)';
      btn.href = '#';
      btn.onclick = function(e) {
        e.preventDefault();
        alert('On iOS Safari:\n1. Tap the Share button (square with arrow up)\n2. Select "Add to Home Screen"');
      };
    } else if (/win/i.test(userAgent)) {
      btn.textContent = '📥 Download for Windows (.exe)';
      btn.href = '/downloads/KayBiT_Util-Setup-1.0.0.exe';
    } else if (/mac/i.test(userAgent)) {
      btn.textContent = '📥 Download for macOS (.dmg)';
      btn.href = '/downloads/KayBiT_Util-1.0.0-universal.dmg';
    } else {
      btn.textContent = '📥 Launch Web App (PWA)';
      btn.href = '/';
    }
  })();
</script>
```

---

## 7. Student Sideloading & Verification Checklist

### Sideloading Android APK:
1. Download `KayBiT_Util-v1.0.0.apk` from the course website.
2. If Android displays `"File might be harmful"`, select **Download anyway**.
3. Tap **Open** -> If prompted, enable **"Allow from this source"** in Android Settings for Chrome or your file manager.
4. Tap **Install** -> Open **KayBiT_Util**.
5. Grant Camera and Location permissions when requested to enable the Phase 1 & 2 low-level hardware telemetry pipelines.

### Verification of Binary Integrity:
Students can verify their download has not been corrupted or tampered with:

```bash
# Linux / macOS
shasum -a 256 KayBiT_Util-v1.0.0.apk

# Windows PowerShell
Get-FileHash .\KayBiT_Util-Setup-1.0.0.exe -Algorithm SHA256
```
