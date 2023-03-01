import { test, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { config } from '@lib/config';
import { KafkaInstanceListPage } from '@lib/pom/streams/kafkaInstanceList';
import { CloudProviders } from '@lib/enums/cloudproviders';
import { ServiceAccountPage } from '@lib/pom/serviceAccounts/sa';
import { AbstractPage } from '@lib/pom/abstractPage';

const testInstanceName = config.instanceName;

test.beforeEach(async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await consoleDotAuthPage.login();

  await kafkaInstancesPage.gotoThroughMenu();

  await page.waitForSelector(AbstractPage.progressBarLocatorString, {
    state: 'detached',
    timeout: config.kafkaInstanceCreationTimeout
  });

  for (const el of await page.locator(`tr >> a`).elementHandles()) {
    const name = await el.textContent();
    await kafkaInstancesPage.deleteKafkaInstance(name);
  }
});

test.afterAll(async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  const kafkaInstancesPage = new KafkaInstanceListPage(page);

  await serviceAccountPage.deleteAllServiceAccounts();
  await kafkaInstancesPage.deleteAllKafkas();
});

// test_3kas.py test_kas_kafka_check_does_not_exist
test('check there are no Kafka instances', async ({ page }) => {
  await expect(page.getByText('No Kafka instances')).toHaveCount(1);
});

// test_3kas.py test_kas_kafka_create_dont_wait_for_ready_delete_wait_for_delete
test('create and delete a Kafka instance', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancesPage.createKafkaInstance(testInstanceName);
  await kafkaInstancesPage.deleteKafkaInstance(testInstanceName);
});

// test_3kas.py test_kas_kafka_create_wait_for_ready_delete_wait_for_delete
test('create, wait for ready and delete a Kafka instance', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancesPage.createKafkaInstance(testInstanceName, false);
  await kafkaInstancesPage.waitForKafkaReady(testInstanceName);
  await kafkaInstancesPage.deleteKafkaInstance(testInstanceName);
});

// test_3kas.py test_kas_kafka_standard_kafka_test_slider
// TODO: check if this is actually what the test is really doing
test('test Kafka creation units slider', async ({ page }) => {
  await page.getByText('Create Kafka instance').click();

  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);

  const slider = page.locator('#streaming-size');

  await expect(slider.locator('.pf-c-slider__step-label').first()).toHaveText(config.minKafkaStreamingUnits.toString());
  await expect(slider.locator('.pf-c-slider__step-label').last()).toHaveText(config.maxKafkaStreamingUnits.toString());
});

const resetFilter = async function (page) {
  if ((await page.getByText('Clear all filters').count()) > 1) {
    await page.getByText('Clear all filters').nth(1).click();
  }
};

const filterByStatus = async function (page, status) {
  await resetFilter(page);
  await page.getByTestId('large-viewport-toolbar').locator('[aria-label="Options menu"]').click();

  await page.locator('button[role="option"]:has-text("Status")').click();
  await page.getByTestId('large-viewport-toolbar').getByText('Filter by status').click();

  await page.getByLabel(status).check(true);

  await page.getByTestId('large-viewport-toolbar').getByText('Filter by status').click();
};

// test_3kas.py test_kas_kafka_filter_by_status
test('test Kafka list filtered by status', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await kafkaInstancesPage.createKafkaInstance(testInstanceName);
  await expect(page.getByText(testInstanceName)).toBeVisible();

  await filterByStatus(page, 'Suspended');
  await expect(page.getByText('No results found')).toHaveCount(1);

  await filterByStatus(page, 'Creating');
  await expect(page.getByText(testInstanceName)).toBeTruthy();

  // Reset the filter
  await resetFilter(page);
  await kafkaInstancesPage.waitForKafkaReady(testInstanceName);

  await filterByStatus(page, 'Ready');
  await expect(page.getByText(testInstanceName)).toBeTruthy();

  await kafkaInstancesPage.deleteKafkaInstance(testInstanceName, false);

  // TODO: Probably race condition when deleting is finished too quickly
  // Currently it just make the test flaky so we should discuss what we will do with it
  await filterByStatus(page, 'Deleting');
  await expect(page.getByText(testInstanceName)).toBeTruthy();

  // await for the kafka instance to be deleted
  await expect(page.getByText(`${testInstanceName}`, { exact: true })).toHaveCount(0, {
    timeout: config.kafkaInstanceDeletionTimeout
  });
});

// test_3kas.py test_try_to_create_kafka_instance_with_same_name
// NOTE: this test is expected to be pretty fragile as it needs that the current instance is in "early" `Creating` status
test('test fail to create Kafka instance with the same name', async ({ page }) => {
  test.skip(true, 'Need a different account');

  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await kafkaInstancesPage.createKafkaInstance(testInstanceName, false);

  await page.getByText('Create Kafka instance').click();
  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);
  await page.getByLabel('Name *').fill(testInstanceName);
  await page.getByTestId('modalCreateKafka-buttonSubmit').click();
  await expect(page.getByText(`${testInstanceName} already exists. Please try a different name.`)).toHaveCount(1);
  await page.locator('#modalCreateKafka > button').click();

  await kafkaInstancesPage.deleteKafkaInstance(testInstanceName);
});

test('create GCP Kafka instance', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancesPage.createKafkaInstance(testInstanceName, false, null, CloudProviders.GCP);
  await kafkaInstancesPage.deleteKafkaInstance(testInstanceName);
});
