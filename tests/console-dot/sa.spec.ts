import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToSAList, createServiceAccount, resetServiceAccount, deleteAllServiceAccounts } from '@lib/sa';

const testServiceAccountPrefix = 'test-service-account-';
const testServiceAccountName = `${testServiceAccountPrefix}${config.sessionID}`;

test.beforeEach(async ({ page }) => {
  await login(page);

  await navigateToSAList(page);

  await page.waitForSelector('[role=progressbar]', {
    state: 'detached' /* ,
    timeout: config.serviceAccountCreationTimeout */
  });
});

test.afterEach(async ({ page }) => {
  await deleteAllServiceAccounts(page);
});

// test_5sa.py test_sa_create
test('test service account creation', async ({ page }) => {
  await createServiceAccount(page, testServiceAccountName);
});

// test_5sa.py test_sa_reset
test('test service account credentials reset', async ({ page }) => {
  const credentials = await createServiceAccount(page, testServiceAccountName);
  const credentials_reset = await resetServiceAccount(page, testServiceAccountName);

  await expect(credentials.clientID).toBe(credentials_reset.clientID);
  await expect(credentials.clientSecret).not.toBe(credentials_reset.clientSecret);
});
