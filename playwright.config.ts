import { defineConfig, devices } from '@playwright/test'

/**
 * Configuração do Playwright para testes E2E
 * Docs: https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Timeout para cada teste
  timeout: 30 * 1000,

  // Rodar testes em paralelo
  fullyParallel: true,

  // Falhar se houver .only no CI
  forbidOnly: !!process.env.CI,

  // Retry em caso de falha (útil para testes flaky)
  retries: process.env.CI ? 2 : 0,

  // Workers paralelos
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [
    ['html'],
    ['list'],
  ],

  use: {
    // URL base da aplicação
    baseURL: 'http://localhost:3000',

    // Tirar screenshot apenas em falhas
    screenshot: 'only-on-failure',

    // Gravar vídeo apenas em falhas
    video: 'retain-on-failure',

    // Trace para debug
    trace: 'on-first-retry',
  },

  // Configurar diferentes navegadores para testar
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Testes mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Iniciar servidor automaticamente antes dos testes
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
