import { expect, Page } from '@playwright/test';
import blockAnalyticsDomains from './blocker';
import { config } from './config';
import { addConsoleLogListeners } from './console_err_listener';

export default async function login(
  page: Page,
  username: string = config.adminUsername,
  password: string = config.adminPassword
) {
  await blockAnalyticsDomains(page);

  // move that into page object model when it will be implemented
  if (config.enableErrLogging) {
    addConsoleLogListeners(page);
  }

  // Go to starting Page
  await page.goto(config.startingPage);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Log In | Red Hat IDP/);

  // do login
  await page.locator('#username-verification').fill(username);
  await page.getByText('Next').click();
  await page.locator('#password').fill(password);
  await page.locator('#rh-password-verification-submit-button').click();

  // check we landed on the right page
  await expect(page).toHaveTitle(/Home/, { timeout: 10000 });
  await expect(page.getByText('Gain increased visibility into your hybrid cloud')).toBeTruthy();
}

export async function logout(page: Page) {
  await page.locator('#UserMenu').click();
  await page.locator('button', { hasText: 'Log out' }).click();
}
