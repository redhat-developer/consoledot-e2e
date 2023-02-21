import { expect, Page } from '@playwright/test';
import { config } from './config';

export default async function login(
  page: Page,
  username: string = config.adminUsername,
  password: string = config.adminPassword
) {
  // Disable analytics
  await page.addInitScript(() => {
    window.localStorage.setItem('chrome:analytics:disable', String(true));
  });

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
