import { test, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { config } from '@lib/config';
import {
  deleteKafkaInstance,
  createKafkaInstance,
  navigateToAccess,
  grantManageAccess,
  findAccessRow,
  revokeAccess,
  waitForKafkaReady
} from '@lib/pom/streams/kafkaInstances';
import { navigateToKafkaList } from '@lib/pom/navigation';

const testInstanceName = config.instanceName;

test.beforeEach(async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  await consoleDotAuthPage.login();

  await navigateToKafkaList(page);

  await expect(page.getByRole('button', { name: 'Create Kafka instance' })).toBeVisible();

  if ((await page.getByText(testInstanceName).count()) > 0 && (await page.locator('tr').count()) === 2) {
    // Test instance present, nothing to do!
  } else {
    await page.waitForSelector('[role=progressbar]', {
      state: 'detached',
      timeout: config.kafkaInstanceCreationTimeout
    });

    for (const el of await page.locator(`tr >> a`).elementHandles()) {
      const name = await el.textContent();

      if (name !== testInstanceName) {
        await deleteKafkaInstance(page, name);
      }
    }

    if ((await page.getByText(testInstanceName).count()) === 0) {
      await createKafkaInstance(page, testInstanceName);
    }
  }
});

test.afterAll(async ({ page }) => {
  await navigateToKafkaList(page);

  try {
    await deleteKafkaInstance(page, testInstanceName);
  } catch (error) {
    //Ignore exception
  }
});

// This test needs to run as an org admin until the new UI with refactored access dialog is released.
test('test kafka manage access permission', async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);

  test.skip(
    config.username_2 == undefined || config.password_2 == undefined,
    'Secondary user has to be defined for this test.'
  );
  await waitForKafkaReady(page, testInstanceName);
  await navigateToAccess(page, testInstanceName);
  await grantManageAccess(page, config.username_2);

  const row = await findAccessRow(page, config.username_2, '', 'Kafka Instance');
  await expect(row).toHaveCount(1);

  await consoleDotAuthPage.logout();
  await consoleDotAuthPage.login(config.username_2, config.password_2);

  await navigateToAccess(page, testInstanceName);
  await grantManageAccess(page, 'All accounts');

  const rowAllAccounts = await findAccessRow(page, 'All Accounts', 'Alter', 'Kafka Instance');
  await expect(rowAllAccounts).toHaveCount(1);

  await revokeAccess(page, 'All Accounts', 'Alter', 'Kafka Instance', true);
  await revokeAccess(page, config.username_2, 'Alter', 'Kafka Instance', true);
});
