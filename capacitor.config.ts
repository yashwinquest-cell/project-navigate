import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.winquest.navigate",
  appName: "Navigate",
  // Next.js static export lands in ./out; Capacitor bundles it into the app.
  webDir: "out",
};

export default config;
