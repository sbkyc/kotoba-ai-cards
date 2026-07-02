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

## TWA APK

The repo includes `twa-manifest.json`.

```powershell
keytool -genkeypair -v -keystore android.keystore -alias kotoba -keyalg RSA -keysize 2048 -validity 10000
npm run android:twa:update
npm run android:twa:apk
```

For a fully verified TWA, publish the generated SHA-256 fingerprint in an Asset Links file for package `io.github.sbkyc.kotoba` at the web origin root.
