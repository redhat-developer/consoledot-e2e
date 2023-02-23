import { test, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { config } from '@lib/config';
import { ServiceAccountPage } from '@lib/pom/serviceAccounts/sa';
import { AbstractPage } from '@lib/pom/abstractPage';

const testServiceAccountPrefix = 'test-service-account-';
const testServiceAccountName = `${testServiceAccountPrefix}${config.sessionID}`;

test.beforeEach(async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  await consoleDotAuthPage.login();

  const serviceAccountPage = new ServiceAccountPage(page);
  await serviceAccountPage.gotoThroughMenu();

  await page.waitForSelector(AbstractPage.progressBarLocatorString, {
    state: 'detached',
    timeout: config.serviceAccountCreationTimeout
  });
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
