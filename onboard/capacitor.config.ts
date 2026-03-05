import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ddd.onboard",
  appName: "DDD Onboard",
  webDir: "dist",
  server: {
    cleartext: true,
  },
};

export default config;
