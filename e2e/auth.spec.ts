import { test, expect } from '@playwright/test'

/**
 * E2E Authentication Tests
 * These tests simulate real user behavior
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/')
  })

  test('should display login page', async ({ page }) => {
    // Verify login page elements
    await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Try login with invalid credentials
    await page.fill('[name="email"]', 'invalid@test.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Verify error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Login with valid credentials
    // IMPORTANT: Use environment variables for test credentials
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || 'test@flexiwell.com')
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || 'Test123!')
    await page.click('button[type="submit"]')

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*admin/)
    await expect(page.getByText(/dashboard/i)).toBeVisible()
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || 'test@flexiwell.com')
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || 'Test123!')
    await page.click('button[type="submit"]')

    // Wait for dashboard to load
    await page.waitForURL(/.*admin/)

    // Logout
    await page.click('[aria-label="User menu"]')
    await page.click('text=/logout|sign out/i')

    // Verify redirect to login
    await expect(page).toHaveURL('/')
  })
})
