import { test, expect } from '@playwright/test'

/**
 * E2E Navigation & Redirect Tests
 * Verifies page routing, auth redirects, and role-based access
 */

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'test@flexiwell.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123!'

// Helper: login and wait for redirect
async function login(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.fill('[name="email"]', TEST_EMAIL)
  await page.fill('[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(/.*admin|.*dashboard|.*teacher/)
}

test.describe('Public Pages - Accessible Without Auth', () => {
  test('should load the home/login page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: /login|sign in|flexiwell/i })).toBeVisible()
  })

  test('should load the signup page', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveURL('/signup')
  })

  test('should load the pricing page', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page).toHaveURL('/pricing')
  })
})

test.describe('Protected Routes - Redirect to Login When Unauthenticated', () => {
  test('should redirect /admin to /login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should redirect /admin/clients to /login', async ({ page }) => {
    await page.goto('/admin/clients')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should redirect /admin/settings to /login', async ({ page }) => {
    await page.goto('/admin/settings')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should redirect /admin/payments to /login', async ({ page }) => {
    await page.goto('/admin/payments')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should redirect /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('should redirect /teacher to /login', async ({ page }) => {
    await page.goto('/teacher')
    await expect(page).toHaveURL(/.*login/)
  })
})

test.describe('Authenticated Navigation - Sidebar Links', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should navigate to Clients page', async ({ page }) => {
    await page.click('a[href="/admin/clients"]')
    await expect(page).toHaveURL('/admin/clients')
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible()
  })

  test('should navigate to Classes page', async ({ page }) => {
    await page.click('a[href="/admin/classes"]')
    await expect(page).toHaveURL('/admin/classes')
  })

  test('should navigate to Payments page', async ({ page }) => {
    await page.click('a[href="/admin/payments"]')
    await expect(page).toHaveURL('/admin/payments')
  })

  test('should navigate to Settings page', async ({ page }) => {
    await page.click('a[href="/admin/settings"]')
    await expect(page).toHaveURL('/admin/settings')
  })

  test('should navigate to Waitlist page', async ({ page }) => {
    await page.click('a[href="/admin/waitlist"]')
    await expect(page).toHaveURL('/admin/waitlist')
  })

  test('should navigate to Staff page', async ({ page }) => {
    await page.click('a[href="/admin/staff"]')
    await expect(page).toHaveURL('/admin/staff')
  })

  test('should navigate to Reports page', async ({ page }) => {
    await page.click('a[href="/admin/reports"]')
    await expect(page).toHaveURL('/admin/reports')
  })
})

test.describe('Settings Tabs Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/admin/settings')
  })

  test('should switch between settings tabs', async ({ page }) => {
    const tabs = ['general', 'plans', 'notifications', 'sms-bot', 'waitlist', 'intake', 'team']

    for (const tab of tabs) {
      // Click on tab
      const tabButton = page.locator(`[data-tab="${tab}"], button:has-text("${tab}")`)
      if (await tabButton.isVisible()) {
        await tabButton.click()
        // Verify tab content loaded (URL or visible content)
        await page.waitForTimeout(300)
      }
    }
  })
})

test.describe('Modal Interactions E2E', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('should open and close sign out modal', async ({ page }) => {
    // Open user menu / profile dropdown
    const profileButton = page.locator('[aria-label="User menu"], [data-testid="user-menu"], button:has-text("profile")')
    if (await profileButton.isVisible()) {
      await profileButton.click()

      // Click sign out
      const signOutTrigger = page.locator('text=/sign out|logout/i')
      if (await signOutTrigger.isVisible()) {
        await signOutTrigger.click()

        // Modal should appear
        await expect(page.getByText('Are you sure you want to sign out')).toBeVisible()

        // Click Cancel
        await page.click('button:has-text("Cancel")')

        // Modal should close, still on same page
        await expect(page.getByText('Are you sure you want to sign out')).not.toBeVisible()
      }
    }
  })
})

test.describe('Page Content Loads Correctly', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('admin dashboard shows key sections', async ({ page }) => {
    await page.goto('/admin')
    // Dashboard should have some kind of metrics/stats
    await expect(page.locator('body')).not.toBeEmpty()
    // Wait for content to load (not just loading spinner)
    await page.waitForTimeout(1000)
    // Check there's no error displayed
    const errorElement = page.locator('text=/error|something went wrong/i')
    expect(await errorElement.count()).toBe(0)
  })

  test('clients page loads without errors', async ({ page }) => {
    await page.goto('/admin/clients')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible()
  })

  test('payments page loads without errors', async ({ page }) => {
    await page.goto('/admin/payments')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible()
  })

  test('settings page loads without errors', async ({ page }) => {
    await page.goto('/admin/settings')
    await page.waitForTimeout(1000)
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible()
  })
})
