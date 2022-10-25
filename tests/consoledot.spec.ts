import { test, expect } from '@playwright/test';

test('can see the homepage', async ({ page }) => {
  // page.on('request', (request) => {
  //   console.log(`Request: ${request.url()} to resource type: ${request.resourceType()}`);
  // });
  // block the marketing scripts to reduce the number of popups we have to accept
  page.route('**/*', route => {
    const blockedUrls = [
      'trustarc',
      'dpal.js',
      'analytics',
      'segment.com'
    ]
    const url = route.request().url();
    return blockedUrls.some(blocked => url.includes(blocked))
      ? route.abort()
      : route.continue();
  })
  await page.goto('https://console.redhat.com');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Log In | Red Hat IDP/);

  // do login
  await page.locator('#username-verification').fill(process.env.TEST_USERNAME!);
  await page.getByText('Next').click();
  await page.locator('#password').fill(process.env.TEST_PASSWORD!);
  await page.locator('#rh-password-verification-submit-button').click();

  // check we landed on the right page
  await expect(page).toHaveTitle(/Home | console.redhat.com/, { timeout: 10000 });
  await expect(page.getByText("Gain increased visibility into your hybrid cloud")).toBeTruthy();
});
