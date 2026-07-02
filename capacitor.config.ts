import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.github.sbkyc.kotoba",
  appName: "Kotoba",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      releaseType: "APK",
    },
  },
};

export default config;
