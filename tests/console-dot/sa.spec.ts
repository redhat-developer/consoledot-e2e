import { expect } from '@playwright/test';
import { test } from '@lib/utils/fixtures';
import { config } from '@lib/config';
import { ServiceAccountPage } from '@lib/pom/serviceAccounts/sa';

const testServiceAccountPrefix = 'test-service-account-';
let testServiceAccountName;

// Use admin user context
test.use({ storageState: config.adminAuthFile });

test.beforeEach(async ({ page }) => {
  testServiceAccountName = `${testServiceAccountPrefix}${Date.now()}`;
  const serviceAccountPage = new ServiceAccountPage(page);
  await serviceAccountPage.gotoThroughMenu();
});

test.afterEach(async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  await serviceAccountPage.deleteAllServiceAccounts();
});

// test_5sa.py test_sa_create
test('test service account creation', async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  await serviceAccountPage.createServiceAccount(testServiceAccountName);
});

// test_5sa.py test_sa_reset
test('test service account credentials reset', async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  const credentials = await serviceAccountPage.createServiceAccount(testServiceAccountName);
  const credentials_reset = await serviceAccountPage.resetServiceAccount(testServiceAccountName);

  expect(credentials.clientID).toBe(credentials_reset.clientID);
  expect(credentials.clientSecret).not.toBe(credentials_reset.clientSecret);
});
