# Multi-Platform CI/CD Pipeline & Secure Production Code Signing Guide

This comprehensive guide details the automated build, test, signing, and distribution workflow for **KayBiT_Util** across all target platforms:
- **Mobile**: iOS (`.ipa`), Android (`.apk` and `.aab`)
- **Desktop**: macOS Universal (`.dmg` & `.app`), Windows (`.msi` & `.exe`), Linux (`.AppImage` & `.deb`)

The workflow utilizes a **3-Environment Build Matrix** (`macos-latest`, `windows-latest`, `ubuntu-latest`), strictly isolates private cryptographic identities via GitHub Secrets, dynamically generates sensitive Xcode export descriptors, automatically deploys to **Apple TestFlight** and **Google Play Internal Testing**, updates **GitHub Releases** with an automated commit changelog, and alerts the team through **Slack, Discord, and Email**.

---

## Table of Contents
1. [Security Philosophy: The Zero-Commit Secret Rule](#1-security-philosophy-the-zero-commit-secret-rule)
2. [Base64 Conversion Commands (Bash vs PowerShell)](#2-base64-conversion-commands-bash-vs-powershell)
3. [Required GitHub Repository Secrets](#3-required-github-repository-secrets)
4. [Complete GitHub Actions Workflow (`build-and-release.yml`)](#4-complete-github-actions-workflow-build-and-releaseyml)
5. [iOS Code Signing & Dynamic `exportOptions.plist`](#5-ios-code-signing--dynamic-exportoptionsplist)
6. [Android Keytool & Production Keystore Setup](#6-android-keytool--production-keystore-setup)
7. [Windows SmartScreen & Tauri `.msi` Packaging](#7-windows-smartscreen--tauri-msi-packaging)
8. [Automated Publishing (TestFlight, Google Play, GitHub Releases)](#8-automated-publishing-testflight-google-play-github-releases)
9. [Team Notifications (Slack, Discord, SMTP Email)](#9-team-notifications-slack-discord-smtp-email)

---

## 1. Security Philosophy: The Zero-Commit Secret Rule

**CRITICAL RULE:** Never commit raw `.p12` certificates, `.mobileprovision` profiles, `.keystore` / `.jks` files, or `.pfx` certificates into Git repositories. 

Once committed, a certificate's private key is permanently exposed in Git history. Instead:
1. Generate certificates and keys locally.
2. Convert binary credential files into **Base64 strings**.
3. Store the strings securely in **GitHub Actions Secrets** (`Settings` > `Secrets and variables` > `Actions`).
4. In the CI runner, reconstruct the binary files into temporary memory-mapped or runner-local directories during the build step, and securely shred/clean them afterward.

---

## 2. Base64 Conversion Commands (Bash vs PowerShell)

Use the table and commands below to encode your credentials before pasting them into GitHub Secrets:

### Converting Android Keystore (`.keystore` / `.jks`)
- **macOS / Linux (Bash)**:
  ```bash
  base64 -i my-release-key.keystore -o android_keystore_base64.txt
  cat android_keystore_base64.txt | pbcopy   # (macOS clipboard)
  ```
- **Windows (PowerShell)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("my-release-key.keystore")) | Out-File -Encoding ASCII android_keystore_base64.txt
  Get-Content android_keystore_base64.txt | Set-Clipboard
  ```

### Converting iOS Distribution Certificate (`.p12`)
- **macOS (Bash)**:
  ```bash
  base64 -i AppleDistCert.p12 -o apple_cert_base64.txt
  cat apple_cert_base64.txt | pbcopy
  ```
- **Windows (PowerShell)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("AppleDistCert.p12")) | Out-File -Encoding ASCII apple_cert_base64.txt
  Get-Content apple_cert_base64.txt | Set-Clipboard
  ```

### Converting iOS Provisioning Profile (`.mobileprovision`)
- **macOS (Bash)**:
  ```bash
  base64 -i AppStore_Profile.mobileprovision -o profile_base64.txt
  cat profile_base64.txt | pbcopy
  ```
- **Windows (PowerShell)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("AppStore_Profile.mobileprovision")) | Out-File -Encoding ASCII profile_base64.txt
  Get-Content profile_base64.txt | Set-Clipboard
  ```

### Converting App Store Connect API Key (`.p8`)
- **macOS (Bash)**:
  ```bash
  base64 -i AuthKey_XXXXXXXXXX.p8 -o appstore_p8_base64.txt
  ```
- **Windows (PowerShell)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("AuthKey_XXXXXXXXXX.p8")) | Out-File -Encoding ASCII appstore_p8_base64.txt
  ```

---

## 3. Required GitHub Repository Secrets

Configure the following secrets in your GitHub repository (`Settings -> Secrets and variables -> Actions -> New repository secret`):

| Secret Name | Purpose | Example / Description |
| :--- | :--- | :--- |
| `APPLE_CERTIFICATE_BASE64` | iOS Distribution `.p12` encoded in Base64 | `MIIK6gIBAzCC...` |
| `APPLE_CERTIFICATE_PASSWORD` | Password protecting the exported `.p12` file | `MySecureCertPass123!` |
| `APPLE_PROVISIONING_PROFILE_BASE64` | iOS App Store `.mobileprovision` encoded in Base64 | `MIIUqAYJKoZIhvcNA...` |
| `APPLE_TEAM_ID` | Apple 10-character Developer Team ID | `ABCDE12345` |
| `APP_BUNDLE_ID` | Application identifier registered in Apple Dev portal | `com.kaybit.camera.gps.util` |
| `PROVISIONING_PROFILE_NAME` | Exact name of your Provisioning Profile | `KayBiT AppStore Distribution` |
| `APP_STORE_CONNECT_KEY_ID` | App Store Connect API Key ID (for TestFlight) | `2X9R4NN3K2` |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect Issuer UUID | `69a6de70-xxxx-47e3-e053-5b8c7c11a4d1` |
| `APP_STORE_CONNECT_PRIVATE_KEY_BASE64` | Private key (`.p8`) encoded in Base64 | `LS0tLS1CRUdJTi...` |
| `ANDROID_KEYSTORE_BASE64` | Android `.keystore` / `.jks` file in Base64 | `/u9+7wAA...` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore master password | `KeystorePassWord99!` |
| `ANDROID_KEY_ALIAS` | Key alias name inside keystore | `kaybit-key` |
| `ANDROID_KEY_PASSWORD` | Alias private key password | `AliasKeyPass99!` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play Console Service Account JSON Key | `{"type": "service_account", ...}` |
| `SLACK_WEBHOOK_URL` | Incoming Webhook URL for Slack alerts | `https://hooks.slack.com/services/T00/B00/X` |
| `DISCORD_WEBHOOK_URL` | Incoming Webhook URL for Discord channel alerts | `https://discord.com/api/webhooks/...` |
| `NOTIFICATION_EMAIL_RECIPIENTS` | Comma-separated email addresses for build alerts | `dev-team@kaybit.app,qa@kaybit.app` |
| `SMTP_SERVER` | SMTP server host for sending build alert emails | `smtp.sendgrid.net` or `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` or `465` |
| `SMTP_USERNAME` | SMTP username / API key | `apikey` |
| `SMTP_PASSWORD` | SMTP password / API token | `SG.xxxxxxxxxxxxxxxx` |

---

## 4. Complete GitHub Actions Workflow (`build-and-release.yml`)

Save this workflow to `.github/workflows/build-and-release.yml` in your repository:

```yaml
name: Multi-Platform Production Build, Code-Sign & Distribution

on:
  push:
    branches:
      - main
      - 'release/**'
  release:
    types:
      - created
  workflow_dispatch:
    inputs:
      distribute_stores:
        description: 'Auto-publish to TestFlight and Google Play Internal'
        required: true
        type: boolean
        default: true

env:
  NODE_VERSION: '20'
  JAVA_VERSION: '17'
  BASE_VERSION: '1.2'

jobs:
  # ============================================================================
  # 1. VERSIONING & METADATA PREPARATION
  # ============================================================================
  prepare:
    name: Prepare Versioning & Changelog
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.ver.outputs.version }}
      build_number: ${{ github.run_number }}
      changelog: ${{ steps.changelog.outputs.changelog }}
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Compute Continuous Semantic Version
        id: ver
        run: |
          BUILD_NUM="${{ github.run_number }}"
          SEM_VER="${{ env.BASE_VERSION }}.${BUILD_NUM}"
          echo "version=${SEM_VER}" >> $GITHUB_OUTPUT
          echo "Computed build version: ${SEM_VER} (Build #${BUILD_NUM})"

      - name: Extract Commit Changelog
        id: changelog
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
          if [ -z "$PREV_TAG" ]; then
            COMMITS=$(git log -n 15 --pretty=format:"* %s (%h)")
          else
            COMMITS=$(git log ${PREV_TAG}..HEAD --pretty=format:"* %s (%h)")
          fi
          # Escape newlines for GitHub Action outputs
          COMMITS="${COMMITS//$'\n'/'%0A'}"
          echo "changelog=${COMMITS}" >> $GITHUB_OUTPUT

  # ============================================================================
  # 2. MACOS RUNNER: iOS (.ipa) & macOS Universal (.dmg / .app)
  # ============================================================================
  build-apple:
    name: Build iOS (.ipa) & macOS Universal (.dmg)
    needs: prepare
    runs-on: macos-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Rust Toolchain for macOS
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: x86_64-apple-darwin,aarch64-apple-darwin

      - name: Install Node Dependencies
        run: npm ci

      - name: Build Web Application
        run: npm run build

      # --- SECURE iOS CODE SIGNING SETUP ---
      - name: Install Apple Distribution Certificate
        uses: apple-actions/import-codesign-certs@v2
        with:
          p12-file-base64: ${{ secrets.APPLE_CERTIFICATE_BASE64 }}
          p12-password: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}

      - name: Install iOS Provisioning Profile
        env:
          PROFILE_BASE64: ${{ secrets.APPLE_PROVISIONING_PROFILE_BASE64 }}
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "$PROFILE_BASE64" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision

      # --- DYNAMIC exportOptions.plist GENERATION (Credentials hidden from repo) ---
      - name: Generate Dynamic exportOptions.plist
        env:
          TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          BUNDLE_ID: ${{ secrets.APP_BUNDLE_ID }}
          PROFILE_NAME: ${{ secrets.PROVISIONING_PROFILE_NAME }}
        run: |
          cat <<EOF > ios/App/exportOptions.plist
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
              <key>method</key>
              <string>app-store</string>
              <key>teamID</key>
              <string>${TEAM_ID}</string>
              <key>uploadBitcode</key>
              <false/>
              <key>compileBitcode</key>
              <false/>
              <key>uploadSymbols</key>
              <true/>
              <key>signingStyle</key>
              <string>manual</string>
              <key>signingCertificate</key>
              <string>Apple Distribution</string>
              <key>provisioningProfiles</key>
              <dict>
                  <key>${BUNDLE_ID}</key>
                  <string>${PROFILE_NAME}</string>
              </dict>
          </dict>
          </plist>
          EOF

      - name: Compile and Archive iOS IPA
        run: |
          npx cap sync ios
          cd ios/App
          xcodebuild -workspace App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath build/App.xcarchive \
            archive \
            CURRENT_PROJECT_VERSION=${{ needs.prepare.outputs.build_number }} \
            MARKETING_VERSION=${{ needs.prepare.outputs.version }}
          xcodebuild -exportArchive \
            -archivePath build/App.xcarchive \
            -exportOptionsPlist exportOptions.plist \
            -exportPath build/out

      - name: Build macOS Universal Binary (.dmg) via Tauri
        run: |
          npm run tauri build -- --target universal-apple-darwin

      - name: Upload iOS & macOS Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: apple-binaries
          path: |
            ios/App/build/out/*.ipa
            src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg

      # --- PUBLISH TO APPLE TESTFLIGHT ---
      - name: Upload to Apple TestFlight
        if: ${{ github.event.inputs.distribute_stores == 'true' || github.event_name == 'release' }}
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: ios/App/build/out/*.ipa
          issuer-id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          api-key-id: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          api-private-key: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY_BASE64 }}

  # ============================================================================
  # 3. WINDOWS RUNNER: Windows Installer (.msi & .exe via Tauri + WiX/NSIS)
  # ============================================================================
  build-windows:
    name: Build Windows (.msi & .exe)
    needs: prepare
    runs-on: windows-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Rust Toolchain for Windows (MSVC)
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: x86_64-pc-windows-msvc

      - name: Install WiX Toolset for MSI generation
        run: |
          dotnet tool install --global wix --version 4.0.5

      - name: Install Node Dependencies
        run: npm ci

      - name: Build Web Application
        run: npm run build

      - name: Compile Windows Tauri Installer (.msi / .exe)
        run: npm run tauri build

      - name: Upload Windows Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-installers
          path: |
            src-tauri/target/release/bundle/msi/*.msi
            src-tauri/target/release/bundle/nsis/*.exe

  # ============================================================================
  # 4. UBUNTU RUNNER: Android (.apk & .aab) and Linux (.AppImage & .deb)
  # ============================================================================
  build-linux-android:
    name: Build Android (.aab/.apk) & Linux (.AppImage/.deb)
    needs: prepare
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Java JDK for Android Compilation
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: ${{ env.JAVA_VERSION }}

      - name: Setup Android SDK and NDK
        uses: android-actions/setup-android@v3

      - name: Install Linux Build Dependencies (PipeWire, WebKit2GTK, GStreamer)
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            build-essential \
            curl \
            wget \
            file \
            libxdo-dev \
            libssl-dev \
            libayatana-appindicator3-dev \
            librsvg2-dev \
            libpipewire-0.3-dev \
            libgstreamer1.0-dev \
            libgstreamer-plugins-base1.0-dev

      - name: Setup Rust Toolchain for Linux
        uses: dtolnay/rust-toolchain@stable

      - name: Install Node Dependencies
        run: npm ci

      - name: Build Web Application
        run: npm run build

      # --- BUILD LINUX DESKTOP PACKAGES ---
      - name: Compile Linux Packages (.AppImage & .deb)
        run: npm run tauri build

      # --- BUILD ANDROID PACKAGES ---
      - name: Sync Capacitor Android
        run: npx cap sync android

      - name: Build Android Release AAB & APK
        working-directory: android
        run: |
          ./gradlew bundleRelease assembleRelease \
            -PversionCode=${{ needs.prepare.outputs.build_number }} \
            -PversionName=${{ needs.prepare.outputs.version }}

      # --- SECURE ANDROID CODE SIGNING ---
      - name: Sign Android AAB via Keystore
        uses: r0adkll/sign-android-release@v1
        id: sign_aab
        with:
          releaseDirectory: android/app/build/outputs/bundle/release
          signingKeyBase64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          alias: ${{ secrets.ANDROID_KEY_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Sign Android APK
        uses: r0adkll/sign-android-release@v1
        id: sign_apk
        with:
          releaseDirectory: android/app/build/outputs/apk/release
          signingKeyBase64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          alias: ${{ secrets.ANDROID_KEY_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload Android & Linux Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: linux-android-binaries
          path: |
            android/app/build/outputs/bundle/release/*.aab
            android/app/build/outputs/apk/release/*.apk
            src-tauri/target/release/bundle/appimage/*.AppImage
            src-tauri/target/release/bundle/deb/*.deb

      # --- PUBLISH TO GOOGLE PLAY INTERNAL TESTING ---
      - name: Deploy to Google Play Internal Testing Track
        if: ${{ github.event.inputs.distribute_stores == 'true' || github.event_name == 'release' }}
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: ${{ secrets.APP_BUNDLE_ID }}
          releaseFiles: android/app/build/outputs/bundle/release/*.aab
          track: internal
          status: completed

  # ============================================================================
  # 5. GITHUB RELEASE ASSETS & COMMIT CHANGELOG
  # ============================================================================
  release:
    name: Package GitHub Release & Changelog
    needs: [prepare, build-apple, build-windows, build-linux-android]
    runs-on: ubuntu-latest
    if: github.event_name == 'release' || github.ref == 'refs/heads/main'
    steps:
      - name: Download All Runner Artifacts
        uses: actions/download-artifact@v4
        with:
          path: dist-release

      - name: Publish to GitHub Releases
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ needs.prepare.outputs.version }}
          name: "KayBiT_Util Release v${{ needs.prepare.outputs.version }} (Build #${{ needs.prepare.outputs.build_number }})"
          body: |
            ### KayBiT_Util Multi-Platform Production Release
            **Version**: `v${{ needs.prepare.outputs.version }}`
            **CI Build Run**: `#${{ needs.prepare.outputs.build_number }}`
            **Forensic Security**: Signed with Hardware/Base64 Keystores & Apple Distribution ID.

            #### Automated Commit Changelog
            ${{ needs.prepare.outputs.changelog }}

            #### Downloadable Binaries
            - **Windows**: `.msi` (Enterprise/Admin Installer) & `.exe` (NSIS Portable)
            - **macOS**: `.dmg` (Universal Binary for Apple Silicon M1/M2/M3 & Intel x86_64)
            - **Linux**: `.AppImage` (Full PipeWire & V4L2 Hardware Support) & `.deb`
            - **Android**: `.apk` (Direct Side-load) & `.aab` (Google Play Bundle)
            - **iOS**: `.ipa` (Internal TestFlight & Ad-Hoc Enterprise)
          files: |
            dist-release/**/*.msi
            dist-release/**/*.exe
            dist-release/**/*.dmg
            dist-release/**/*.AppImage
            dist-release/**/*.deb
            dist-release/**/*.apk
            dist-release/**/*.aab
            dist-release/**/*.ipa
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ============================================================================
  # 6. TEAM NOTIFICATIONS: Slack, Discord, and SMTP Email
  # ============================================================================
  notify:
    name: Notify Team (Slack, Discord, Email)
    needs: [prepare, release]
    if: always()
    runs-on: ubuntu-latest
    steps:
      # --- SLACK NOTIFICATION ---
      - name: Send Slack Notification
        if: env.SLACK_WEBHOOK != ''
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
        run: |
          STATUS="${{ needs.release.result }}"
          COLOR="#2eb886"
          if [ "$STATUS" != "success" ]; then COLOR="#a30200"; fi
          PAYLOAD=$(cat <<EOF
          {
            "attachments": [
              {
                "color": "${COLOR}",
                "title": "KayBiT_Util Build #${{ needs.prepare.outputs.build_number }} [${STATUS^^}]",
                "text": "Version: v${{ needs.prepare.outputs.version }}\nEvent: ${{ github.event_name }}\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}",
                "footer": "GitHub Actions CI/CD"
              }
            ]
          }
          EOF
          )
          curl -X POST -H 'Content-type: application/json' --data "$PAYLOAD" "$SLACK_WEBHOOK" || true

      # --- DISCORD NOTIFICATION ---
      - name: Send Discord Notification
        if: env.DISCORD_WEBHOOK != ''
        env:
          DISCORD_WEBHOOK: ${{ secrets.DISCORD_WEBHOOK_URL }}
        run: |
          STATUS="${{ needs.release.result }}"
          EMOJI="🚀"
          if [ "$STATUS" != "success" ]; then EMOJI="🚨"; fi
          PAYLOAD=$(cat <<EOF
          {
            "username": "KayBiT CI/CD Bot",
            "content": "${EMOJI} **KayBiT_Util Build #${{ needs.prepare.outputs.build_number }}** finished with status: **${STATUS}**!\n- **Version**: \`v${{ needs.prepare.outputs.version }}\`\n- **Branch**: \`${{ github.ref_name }}\`\n- **Target Stores**: TestFlight & Google Play Internal"
          }
          EOF
          )
          curl -X POST -H 'Content-type: application/json' --data "$PAYLOAD" "$DISCORD_WEBHOOK" || true

      # --- SMTP EMAIL ALERT ---
      - name: Send Build Status Email Alert
        if: env.SMTP_USER != ''
        uses: dawidd6/action-send-mail@v3
        env:
          SMTP_USER: ${{ secrets.SMTP_USERNAME }}
        with:
          server_address: ${{ secrets.SMTP_SERVER }}
          server_port: ${{ secrets.SMTP_PORT }}
          username: ${{ secrets.SMTP_USERNAME }}
          password: ${{ secrets.SMTP_PASSWORD }}
          subject: "[KayBiT CI] Build #${{ needs.prepare.outputs.build_number }} - ${{ needs.release.result }}"
          to: ${{ secrets.NOTIFICATION_EMAIL_RECIPIENTS }}
          from: "KayBiT Build Bot <builds@kaybit.app>"
          body: |
            KayBiT_Util Multiplatform Build Status Update:
            
            Build Number: ${{ needs.prepare.outputs.build_number }}
            Semantic Version: v${{ needs.prepare.outputs.version }}
            Status: ${{ needs.release.result }}
            Triggered by: ${{ github.actor }}
            Commit: ${{ github.sha }}
            
            View build details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

---

## 5. iOS Code Signing & Dynamic `exportOptions.plist`

### The Xcode Export Problem
When running `xcodebuild -exportArchive`, Xcode requires an `exportOptions.plist` specifying the distribution method, Team ID, signing certificate style, and profile UUID/name. 

Committing this file to your public repository reveals your Apple Team ID and bundle identifiers.

### The Dynamic Injection Solution
In the workflow step `Generate Dynamic exportOptions.plist`, the runner dynamically synthesizes the file into `ios/App/exportOptions.plist` using GitHub Secrets at build time:

```bash
cat <<EOF > ios/App/exportOptions.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>${TEAM_ID}</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>${BUNDLE_ID}</key>
        <string>${PROFILE_NAME}</string>
    </dict>
</dict>
</plist>
EOF
```

This guarantees:
1. Zero proprietary Apple developer IDs exist in Git version control.
2. The exact matching distribution profile is applied automatically during archive export.

---

## 6. Android Keytool & Production Keystore Setup

To generate your production Android keystore locally:

### In Terminal / Bash:
```bash
keytool -genkey -v \
  -keystore kaybit-release.keystore \
  -alias kaybit-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype JKS
```

### In PowerShell (Windows):
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v `
  -keystore kaybit-release.keystore `
  -alias kaybit-key `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000 `
  -storetype JKS
```

Convert the output keystore to a Base64 string and paste into `ANDROID_KEYSTORE_BASE64`.

The workflow step `Sign Android AAB via Keystore` automatically:
1. Materializes the keystore file into a secure runner-local directory.
2. Signs the `.aab` (Android App Bundle) and `.apk` with `v2/v3/v4` signature schemes.
3. Aligns the zip archive with `zipalign`.
4. Sanitizes temporary secrets from disk upon completion.

---

## 7. Windows SmartScreen & Tauri `.msi` Packaging

When compiling with Tauri on the `windows-latest` runner, Tauri uses the **WiX Toolset** to output standard enterprise `.msi` packages and **NSIS** for executable `.exe` setup wizards.

### Bypassing Windows SmartScreen Warnings
Unsigned Windows installers prompt users with the blue **"Windows protected your PC / Unknown Publisher"** SmartScreen dialog.

To eliminate this in production:
1. Purchase an **EV (Extended Validation)** or standard **OV Code Signing Certificate** from a certified Certificate Authority (e.g., DigiCert, Sectigo, SSL.com).
2. Store the certificate as a Base64 secret `WINDOWS_CERTIFICATE_PFX_BASE64` and password `WINDOWS_CERTIFICATE_PASSWORD`.
3. Add a signing step in the Windows job before packaging:
   ```powershell
   [IO.File]::WriteAllBytes("cert.pfx", [Convert]::FromBase64String("${{ secrets.WINDOWS_CERTIFICATE_PFX_BASE64 }}"))
   & "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign `
     /f cert.pfx `
     /p "${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}" `
     /tr http://timestamp.digicert.com `
     /td sha256 `
     /fd sha256 `
     src-tauri\target\release\bundle\msi\*.msi
   Remove-Item cert.pfx -Force
   ```

---

## 8. Automated Publishing (TestFlight, Google Play, GitHub Releases)

### Apple TestFlight
Using `apple-actions/upload-testflight-build@v1`:
- Connects directly to App Store Connect via JWT using `APP_STORE_CONNECT_KEY_ID` and `APP_STORE_CONNECT_ISSUER_ID`.
- Transmits the signed `.ipa` directly to TestFlight internal tester groups.
- Version is continuously incremented using `${{ github.run_number }}` so TestFlight never rejects duplicate build numbers.

### Google Play Internal Testing Track
Using `r0adkll/upload-google-play@v1`:
- Uses the Google Cloud Service Account JSON key authorized under the Google Play Console API Access.
- Deploys the signed `.aab` to the `internal` track for immediate zero-delay tester updates.

### GitHub Releases with Automated Changelog
- The `prepare` job extracts git commits between the current commit and the preceding release tag (`git log --pretty=format:"* %s (%h)"`).
- Assets from all three runner environments (`.msi`, `.exe`, `.dmg`, `.AppImage`, `.deb`, `.apk`, `.aab`, `.ipa`) are compiled into a unified release on GitHub with release notes populated directly by the git changelog.

---

## 9. Team Notifications (Slack, Discord, SMTP Email)

The final `notify` job runs with `if: always()`, meaning it executes regardless of whether previous compilation jobs succeeded or failed:

1. **Slack**: Sends a color-coded message card (Green for success, Crimson for failure) with version, commit hash, and branch.
2. **Discord**: Sends a rich webhook message with emojis and direct download references.
3. **Email (SMTP)**: Dispatches an email report to QA and engineering team leads detailing build run time, actor, and workflow execution logs.

---

*Document generated for KayBiT_Util Multiplatform Systems Engineering Pipeline.*
