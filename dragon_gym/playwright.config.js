const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './playwright',
  timeout: 180000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1080, height: 1920 },
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    timeout: 180000,
    reuseExistingServer: true,
    env: {
      REACT_APP_DISABLE_ADS: 'true',
    },
  },
});
