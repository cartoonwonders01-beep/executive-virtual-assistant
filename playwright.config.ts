import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'https://127.0.0.1:5173',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    headless: true,
  },
  webServer: {
    command: 'npx vite preview --host 127.0.0.1 --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    {
      name: 'Mobile-Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Tablet-Chrome',
      use: { ...devices['Galaxy Tab S4'] },
    },
    {
      name: 'Desktop-Chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
});
