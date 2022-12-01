import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToSAList, createServiceAccount, deleteServiceAccount, resetServiceAccount } from '@lib/sa';

const testServiceAccountName = `test-service-account-${config.sessionID}`;

test.beforeEach(async ({ page }) => {
  await login(page);

  await navigateToSAList(page);

  await page.waitForSelector('[role=progressbar]', {
    state: 'detached',
    timeout: config.serviceAccountCreationTimeout
  });

  const elements = async () => {
    return await (
      await page.locator(`tr >> td[data-label="Description"]`).elementHandles()
    ).length;
  };

  while ((await elements()) > 0) {
    const el = await page.locator(`tr >> td[data-label="Description"]`).nth(0);
    const accountID = await el.textContent();
    await deleteServiceAccount(page, accountID);
  }
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
