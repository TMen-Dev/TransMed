import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.transmed.app',
  appName: 'TransMed',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Camera: {},
  },
}

export default config
