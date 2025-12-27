import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// Welcome
Then('I should see a personalized welcome message', async function (this: PlaywrightWorld) {
  const welcome = this.page.locator('text=/Welcome|Good morning|Good afternoon|Good evening/');
  await expect(welcome.first()).toBeVisible();
});

Then('I should see my upcoming classes', async function (this: PlaywrightWorld) {
  const upcomingClasses = this.page.locator('text=/Upcoming|Next class|Schedule/');
  await expect(upcomingClasses.first()).toBeVisible();
});

// Classes
Then('I should see the class calendar', async function (this: PlaywrightWorld) {
  const calendar = this.page.locator('[class*="calendar"], [class*="Calendar"]');
  await expect(calendar.first()).toBeVisible();
});

Then('I should be able to switch between calendar views', async function (this: PlaywrightWorld) {
  const viewToggle = this.page.locator('button:has-text("Week"), button:has-text("Month"), button:has-text("Day")');
  await expect(viewToggle.first()).toBeVisible();
});

// Settings
Then('I should be on the settings page', async function (this: PlaywrightWorld) {
  await expect(this.page).toHaveURL(/settings/);
});

Then('I should see the profile tab active', async function (this: PlaywrightWorld) {
  const profileTab = this.page.locator('button:has-text("Profile")');
  await expect(profileTab).toBeVisible();
});

When('I change my phone number', async function (this: PlaywrightWorld) {
  const phoneInput = this.page.locator('input[type="tel"], input[placeholder*="phone"]');
  await phoneInput.fill('+1 (555) 999-8888');
});

When('I click {string}', async function (this: PlaywrightWorld, buttonText: string) {
  this.page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await this.page.click(`button:has-text("${buttonText}")`);
});

When('I click on the {string} tab', async function (this: PlaywrightWorld, tabName: string) {
  await this.page.click(`button:has-text("${tabName}")`);
});

Then('I should see my current plan', async function (this: PlaywrightWorld) {
  const currentPlan = this.page.locator('text=/Premium|Growth|Starter|Plan/');
  await expect(currentPlan.first()).toBeVisible();
});

Then('I should see my billing history', async function (this: PlaywrightWorld) {
  const billingHistory = this.page.locator('text=/Billing history|Invoice|Payment/');
  await expect(billingHistory.first()).toBeVisible();
});

// Support
Then('I should see the support chat interface', async function (this: PlaywrightWorld) {
  const chatInterface = this.page.locator('text=/Support|Chat|Message/');
  await expect(chatInterface.first()).toBeVisible();
});

Then('I should be able to type a message', async function (this: PlaywrightWorld) {
  const messageInput = this.page.locator('input[placeholder*="message"], textarea[placeholder*="message"]');
  await expect(messageInput).toBeVisible();
});
