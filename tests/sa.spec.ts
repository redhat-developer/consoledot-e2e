import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToSAList, createServiceAccount, deleteServiceAccount, resetServiceAccount } from '@lib/sa';

const testServiceAccountPrefix = 'test-service-account-';
const testServiceAccountName = `${testServiceAccountPrefix}${config.sessionID}`;

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Application and Data Services' }).click();
  await navigateToSAList(page);

  await page.waitForSelector('[role=progressbar]', {
    state: 'detached',
    timeout: config.serviceAccountCreationTimeout
  });

  await deleteServiceAccount(page, testServiceAccountPrefix);
});

test.afterAll(async ({ page }) => {
  await deleteServiceAccount(page, testServiceAccountName);
});

// test_5sa.py test_sa_create
test('test service account creation', async ({ page }) => {
  await createServiceAccount(page, testServiceAccountName);
  await deleteServiceAccount(page, testServiceAccountName);
});

// test_5sa.py test_sa_create
test('test service account credentials reset', async ({ page }) => {
  const credentials = await createServiceAccount(page, testServiceAccountName);
  const credentials_reset = await resetServiceAccount(page, testServiceAccountName);

  await expect(credentials.clientID).toBe(credentials_reset.clientID);
  await expect(credentials.clientSecret).not.toBe(credentials_reset.clientSecret);

  await deleteServiceAccount(page, testServiceAccountName);
});
