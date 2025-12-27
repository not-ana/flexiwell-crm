import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// Dashboard stats
Then('I should see the active clients count', async function (this: PlaywrightWorld) {
  const clientsCard = this.page.locator('text="Active Clients"');
  await expect(clientsCard).toBeVisible();
});

Then('I should see the monthly revenue', async function (this: PlaywrightWorld) {
  const revenueCard = this.page.locator('text=/Revenue|\\$\\d/');
  await expect(revenueCard.first()).toBeVisible();
});

Then('I should see the attendance rate', async function (this: PlaywrightWorld) {
  const attendanceCard = this.page.locator('text=/Attendance|%/');
  await expect(attendanceCard.first()).toBeVisible();
});

Then('I should see the pending payments count', async function (this: PlaywrightWorld) {
  const paymentsCard = this.page.locator('text=/Pending|Payment/');
  await expect(paymentsCard.first()).toBeVisible();
});

// Navigation
When('I click on {string} clients link', async function (this: PlaywrightWorld, linkText: string) {
  await this.page.click(`a:has-text("${linkText}")`);
  await this.page.waitForLoadState('networkidle');
});

Then('I should be on the clients page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/clients/);
});

Then('I should be on the staff management page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/staff/);
});

// Schedule
Then('I should see the schedule card', async function (this: PlaywrightWorld) {
  const scheduleCard = this.page.locator('text=/Schedule|Today/');
  await expect(scheduleCard.first()).toBeVisible();
});

Then('I should see classes listed for today', async function (this: PlaywrightWorld) {
  const classList = this.page.locator('[class*="class"], [class*="schedule"]');
  await expect(classList.first()).toBeVisible();
});

// Notifications
Then('I should be on the notifications settings page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/notifications/);
});

Then('I should see notification preference options', async function (this: PlaywrightWorld) {
  const notificationOptions = this.page.locator('text="General notifications"');
  await expect(notificationOptions).toBeVisible();
});
