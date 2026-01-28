import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pastibot.app',
  appName: 'Pastibot',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
