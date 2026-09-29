import { defineConfig } from '@playwright/test'
import process from 'node:process'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'https://localhost:5180/refactored-training/',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run e2e:server',
    port: 5180,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})