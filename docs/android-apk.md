# Android APK Build

Kotoba is already a PWA, but the repository is prepared for a real Android APK in two ways:

- **Capacitor**: recommended for this GitHub Pages project because it packages the exported Next.js app into a native Android shell and does not depend on Digital Asset Links at `https://sbkyc.github.io/.well-known/assetlinks.json`.
- **TWA / Bubblewrap**: useful when the public web origin can publish Digital Asset Links at the origin root. For a GitHub Pages project path, it may still build an APK, but full trusted fullscreen behavior depends on root-level asset links.

## Do Not Install Tooling On C Drive

Use D drive paths for Android tooling and caches:

```powershell
$env:ANDROID_HOME = "D:\CodexTools\Android\Sdk"
$env:ANDROID_SDK_ROOT = "D:\CodexTools\Android\Sdk"
$env:JAVA_HOME = "D:\CodexTools\jdk-21"
$env:GRADLE_USER_HOME = "D:\CodexTools\gradle"
$env:npm_config_cache = "D:\CodexTools\npm-cache"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:Path"
```

Capacitor 8 uses an Android toolchain that compiles with Java 21. Install JDK 21 and Android command-line tools into the D drive paths above before building.

## Capacitor APK

After installing the Android SDK and running `npm install`:

```powershell
npm run build
npx cap add android
npm run android:sync
npm run android:apk
```

The APK is generated under:

```text
android/app/build/outputs/apk/
```

For a debug installable build, use:

```powershell
npm run android:apk
```

The generated file is:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Release APK / AAB Signing

For an installable test on your own Android phone, the debug APK above is enough. For sharing a release APK or uploading to an app store, create a private signing key on the D drive and keep it out of Git:

```powershell
New-Item -ItemType Directory -Force D:\KotobaKeys
keytool -genkeypair -v -keystore D:\KotobaKeys\kotoba-release.jks -alias kotoba -keyalg RSA -keysize 2048 -validity 10000
```

Set signing variables only in the current PowerShell session:

```powershell
$env:KOTOBA_RELEASE_STORE_FILE = "D:\KotobaKeys\kotoba-release.jks"
$env:KOTOBA_RELEASE_STORE_PASSWORD = "<your-keystore-password>"
$env:KOTOBA_RELEASE_KEY_ALIAS = "kotoba"
$env:KOTOBA_RELEASE_KEY_PASSWORD = "<your-key-password>"
```

Then build a release APK or Android App Bundle:

```powershell
npm run android:release:apk
npm run android:release:aab
```

Outputs:

```text
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

If the `KOTOBA_RELEASE_*` variables are not set, Gradle can still create an unsigned release artifact for inspection, but it is not suitable for normal installation or distribution.

## TWA APK

The repo includes `twa-manifest.json`.

```powershell
keytool -genkeypair -v -keystore android.keystore -alias kotoba -keyalg RSA -keysize 2048 -validity 10000
npm run android:twa:update
npm run android:twa:apk
```

For a fully verified TWA, publish the generated SHA-256 fingerprint in an Asset Links file for package `io.github.sbkyc.kotoba` at the web origin root.
