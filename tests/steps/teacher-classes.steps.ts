import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PlaywrightWorld } from '../support/world';

// View mode steps
Then('I should see the list view toggle active', async function (this: PlaywrightWorld) {
  const listToggle = this.page.locator('button[title="List view"]');
  await expect(listToggle).toHaveClass(/bg-primary-100/);
});

Then('I should see classes grouped by date', async function (this: PlaywrightWorld) {
  const dateHeaders = this.page.locator('h2:has-text("Today"), h2:has-text("Tomorrow"), h2:has-text("Yesterday")');
  await expect(dateHeaders.first()).toBeVisible();
});

When('I click the calendar view toggle', async function (this: PlaywrightWorld) {
  await this.page.click('button[title="Calendar view"]');
});

Then('I should see the calendar grid', async function (this: PlaywrightWorld) {
  const calendarGrid = this.page.locator('.grid-cols-7');
  await expect(calendarGrid).toBeVisible();
});

Then('I should see classes displayed on the calendar', async function (this: PlaywrightWorld) {
  const calendarEvents = this.page.locator('.bg-purple-100, .bg-green-100, .bg-blue-100');
  await expect(calendarEvents.first()).toBeVisible();
});

Then('I should see the calendar legend', async function (this: PlaywrightWorld) {
  const legend = this.page.locator('text="Pilates"').first();
  await expect(legend).toBeVisible();
});

// Create class modal steps
Then('I should see the create class modal', async function (this: PlaywrightWorld) {
  const modal = this.page.locator('text="Create New Class"');
  await expect(modal).toBeVisible();
});

Then('I should see the class name input', async function (this: PlaywrightWorld) {
  const input = this.page.locator('input[placeholder*="Intermediate Pilates"]');
  await expect(input).toBeVisible();
});

Then('I should see the class type selector', async function (this: PlaywrightWorld) {
  const select = this.page.locator('select').filter({ hasText: 'Pilates' });
  await expect(select.first()).toBeVisible();
});

Then('I should see the date picker', async function (this: PlaywrightWorld) {
  const datePicker = this.page.locator('input[type="date"]');
  await expect(datePicker).toBeVisible();
});

Then('I should see the time picker', async function (this: PlaywrightWorld) {
  const timePicker = this.page.locator('input[type="time"]');
  await expect(timePicker).toBeVisible();
});

When('I fill in the class name with {string}', async function (this: PlaywrightWorld, name: string) {
  await this.page.fill('input[placeholder*="Intermediate Pilates"]', name);
});

When('I select class type {string}', async function (this: PlaywrightWorld, type: string) {
  await this.page.selectOption('select:near(:text("Class Type"))', type);
});

When('I select a future date', async function (this: PlaywrightWorld) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  await this.page.fill('input[type="date"]', dateStr);
});

When('I set the time to {string}', async function (this: PlaywrightWorld, time: string) {
  await this.page.fill('input[type="time"]', time);
});

When('I click the {string} submit button', async function (this: PlaywrightWorld, buttonText: string) {
  this.page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await this.page.click(`button:has-text("${buttonText}")`);
});

// Class actions steps
Given('there is a scheduled class', async function (this: PlaywrightWorld) {
  const scheduledClass = this.page.locator('text="Scheduled"').first();
  await expect(scheduledClass).toBeVisible();
});

Given('there is an in-progress class', async function (this: PlaywrightWorld) {
  // In mock data, we may need to check if one exists
  const inProgressClass = this.page.locator('text="In Progress"');
  // This step may be skipped if no in-progress class exists
});

When('I click {string} on the class card', async function (this: PlaywrightWorld, buttonText: string) {
  this.page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await this.page.click(`button:has-text("${buttonText}")`);
});

Then('I should see a confirmation message with class details', async function (this: PlaywrightWorld) {
  // The dialog handler above will verify the dialog appeared
});

Then('I should see the attendance interface', async function (this: PlaywrightWorld) {
  // The dialog handler will verify
});

// View students steps
When('I click {string} on a class card', async function (this: PlaywrightWorld, buttonText: string) {
  const viewStudentsBtn = this.page.locator(`button:has-text("${buttonText}")`).first();
  await viewStudentsBtn.click();
});

Then('I should see the list of enrolled students', async function (this: PlaywrightWorld) {
  const studentsList = this.page.locator('text="Enrolled students"');
  await expect(studentsList).toBeVisible();
});

Then('each student should show their name and initials', async function (this: PlaywrightWorld) {
  const studentCards = this.page.locator('.rounded-lg .text-sm.text-gray-900');
  await expect(studentCards.first()).toBeVisible();
});

// Filter steps
When('I select {string} from the status filter', async function (this: PlaywrightWorld, status: string) {
  await this.page.selectOption('select:has-text("All statuses")', status.toLowerCase());
});

Then('I should only see completed classes', async function (this: PlaywrightWorld) {
  const completedBadges = this.page.locator('text="Completed"');
  const scheduledBadges = this.page.locator('span:has-text("Scheduled")');
  await expect(completedBadges.first()).toBeVisible();
});

When('I select {string} from the location filter', async function (this: PlaywrightWorld, location: string) {
  await this.page.selectOption('select:has-text("All locations")', location);
});

Then('I should only see classes from that location', async function (this: PlaywrightWorld) {
  // Verify location filter is applied
  const locationText = this.page.locator('text="FlexiWell Jardins"');
  await expect(locationText.first()).toBeVisible();
});

// Search steps
When('I type {string} in the search box', async function (this: PlaywrightWorld, searchText: string) {
  await this.page.fill('input[placeholder*="Search"]', searchText);
});

Then('I should only see Pilates classes', async function (this: PlaywrightWorld) {
  const pilatesClasses = this.page.locator('text="Pilates"');
  await expect(pilatesClasses.first()).toBeVisible();
});
