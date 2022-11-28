import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToSAList, createServiceAccount, deleteServiceAccount, resetServiceAccount } from '@lib/sa';

test.beforeEach(async ({ page }, testInfo) => {
  await login(page);

  await navigateToSAList(page);

  await page.waitForSelector('[role=progressbar]', {
    state: 'detached',
    timeout: config.serviceAccountCreationTimeout
  });

  const elements = await page.locator(`tr >> td[data-label="Description"]`).elementHandles()

  // for loop jumps over one element every time
  for (const el of elements) {
    console.log("element from beforeEach: " + el);
    const accountID = await el.textContent();
    console.log("Account to be deleted: " + accountID)
    await deleteServiceAccount(page, accountID);
  }
});

// test_5sa.py test_sa_create
test('test service account creation', async ({ page }) => {
  const testServiceAccountName = `test-service-account-${config.sessionID}`;

  await createServiceAccount(page, testServiceAccountName);
  await deleteServiceAccount(page, testServiceAccountName);
});

// test_5sa.py test_sa_create
test('test service account credentials reset', async ({ page }) => {
  const testServiceAccountName = `test-service-account-${config.sessionID}`;

  const credentials = await createServiceAccount(page, testServiceAccountName);
  const credentials_reset = await resetServiceAccount(page, testServiceAccountName);

  expect(credentials.clientID === credentials_reset.clientID);
  expect(credentials.clientSecret != credentials_reset.clientSecret);

  await deleteServiceAccount(page, testServiceAccountName);
});
