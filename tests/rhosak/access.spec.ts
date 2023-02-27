import { test, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { config } from '@lib/config';
import { KafkaInstancesPage } from '@lib/pom/streams/kafkaInstances';
import { AbstractPage } from '@lib/pom/abstractPage';
import { AccessPage } from '@lib/pom/streams/instance/access';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';

const testInstanceName = config.instanceName;

test.beforeEach(async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  const kafkaInstancesPage = new KafkaInstancesPage(page);

  await consoleDotAuthPage.login();
  await kafkaInstancesPage.gotoThroughMenu();

  if ((await page.getByText(testInstanceName).count()) > 0 && (await page.locator('tr').count()) === 2) {
    // Test instance present, nothing to do!
  } else {
    await page.waitForSelector(AbstractPage.progressBarLocatorString, {
      state: 'detached',
      timeout: config.kafkaInstanceCreationTimeout
    });

    for (const el of await page.locator(`tr >> a`).elementHandles()) {
      const name = await el.textContent();

      if (name !== testInstanceName) {
        await kafkaInstancesPage.deleteKafkaInstance(name);
      }
    }

    if ((await page.getByText(testInstanceName).count()) === 0) {
      await kafkaInstancesPage.createKafkaInstance(testInstanceName);
      await kafkaInstancesPage.waitForKafkaReady(testInstanceName);
    }
  }
});

test.afterAll(async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  try {
    await kafkaInstancesPage.deleteKafkaInstance(testInstanceName);
  } catch (error) {
    //Ignore exception
  }
});

// This test needs to run as an org admin until the new UI with refactored access dialog is released.
test('test kafka manage access permission', async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const kafkaAccessPage = new AccessPage(page, testInstanceName);

  test.skip(
    config.username_2 == undefined || config.password_2 == undefined,
    'Secondary user has to be defined for this test.'
  );

  await kafkaInstancesPage.waitForKafkaReady(testInstanceName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await kafkaAccessPage.gotoThroughMenu();
  await kafkaAccessPage.grantManageAccess(config.username_2);

  const row = await kafkaAccessPage.findAccessRow(config.username_2, '', 'Kafka Instance');
  await expect(row).toHaveCount(1);

  await consoleDotAuthPage.logout();
  await consoleDotAuthPage.login(config.username_2, config.password_2);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await kafkaAccessPage.gotoThroughMenu();
  await kafkaAccessPage.grantManageAccess('All accounts');

  const rowAllAccounts = await kafkaAccessPage.findAccessRow('All Accounts', 'Alter', 'Kafka Instance');
  await expect(rowAllAccounts).toHaveCount(1);

  await kafkaAccessPage.revokeAccess('All Accounts', 'Alter', 'Kafka Instance', true);
  await kafkaAccessPage.revokeAccess(config.username_2, 'Alter', 'Kafka Instance', true);
});
