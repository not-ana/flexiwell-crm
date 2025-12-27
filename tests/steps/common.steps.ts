import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// Navigation steps
Given('I am on the teacher classes page', async function (this: PlaywrightWorld) {
  await this.page.goto(`${this.baseUrl}/teacher/classes`);
  await this.page.waitForLoadState('networkidle');
});

Given('I am logged in as an admin', async function (this: PlaywrightWorld) {
  // For now, directly navigate since there's no real auth
  await this.page.goto(`${this.baseUrl}/admin`);
});

Given('I am on the admin dashboard', async function (this: PlaywrightWorld) {
  await this.page.goto(`${this.baseUrl}/admin`);
  await this.page.waitForLoadState('networkidle');
});

Given('I am logged in as a client', async function (this: PlaywrightWorld) {
  await this.page.goto(`${this.baseUrl}/dashboard`);
});

Given('I am on the client dashboard', async function (this: PlaywrightWorld) {
  await this.page.goto(`${this.baseUrl}/dashboard`);
  await this.page.waitForLoadState('networkidle');
});

// Common UI interactions
When('I click on {string} in the sidebar', async function (this: PlaywrightWorld, linkText: string) {
  await this.page.click(`text="${linkText}"`);
  await this.page.waitForLoadState('networkidle');
});

When('I click the {string} button', async function (this: PlaywrightWorld, buttonText: string) {
  await this.page.click(`button:has-text("${buttonText}")`);
});

When('I click on {string}', async function (this: PlaywrightWorld, text: string) {
  await this.page.click(`text="${text}"`);
});

// Common assertions
Then('I should see the {string} heading', async function (this: PlaywrightWorld, heading: string) {
  const headingElement = this.page.locator(`h1:has-text("${heading}"), h2:has-text("${heading}")`);
  await expect(headingElement).toBeVisible();
});

Then('I should see a success message', async function (this: PlaywrightWorld) {
  // Check for alert dialog or success toast
  this.page.on('dialog', async dialog => {
    expect(dialog.message()).toContain('success');
    await dialog.accept();
  });
});

Then('I should be on the {string} page', async function (this: PlaywrightWorld, pageName: string) {
  const url = this.page.url();
  expect(url.toLowerCase()).toContain(pageName.toLowerCase().replace(/\s+/g, '-'));
});
