import { test, expect } from '@playwright/test'

/**
 * E2E Booking Tests
 * Complete test of class booking flow
 */

test.describe('Booking Flow', () => {
  // Login before all tests
  test.beforeEach(async ({ page }) => {
    await page.goto('/')

    // Login
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL || 'test@flexiwell.com')
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD || 'Test123!')
    await page.click('button[type="submit"]')

    // Wait for dashboard to load
    await page.waitForURL(/.*admin/)
  })

  test('should display classes list', async ({ page }) => {
    // Navigate to classes page
    await page.click('text=/classes/i')

    // Verify classes list is visible
    await expect(page.getByRole('heading', { name: /classes/i })).toBeVisible()

    // Verify class cards exist
    const classCards = page.locator('[data-testid="class-card"]')
    await expect(classCards.first()).toBeVisible()
  })

  test('should book a class successfully', async ({ page }) => {
    // Navigate to classes
    await page.click('text=/classes/i')

    // Select first available class
    await page.click('[data-testid="class-card"]:first-child')

    // Click book button
    await page.click('button:has-text("Book")')

    // Confirm booking
    await page.click('button:has-text("Confirm")')

    // Verify success message
    await expect(page.getByText(/booking confirmed/i)).toBeVisible()
  })

  test('should cancel a booking', async ({ page }) => {
    // Navigate to my bookings
    await page.click('text=/my bookings/i')

    // Select first booking
    await page.click('[data-testid="booking-card"]:first-child')

    // Cancel
    await page.click('button:has-text("Cancel")')

    // Confirm cancellation
    await page.click('button:has-text("Confirm cancellation")')

    // Verify success message
    await expect(page.getByText(/booking cancelled/i)).toBeVisible()
  })

  test('should show error when booking without credits', async ({ page }) => {
    // This test assumes user has no credits
    // You can create a specific test user for this

    await page.click('text=/classes/i')
    await page.click('[data-testid="class-card"]:first-child')
    await page.click('button:has-text("Book")')

    // Verify error message
    await expect(page.getByText(/insufficient credits/i)).toBeVisible()
  })
})
