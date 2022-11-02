import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToKafkaList, deleteKafkaInstance, createKafkaInstance, waitForKafkaReady } from '@lib/kafka';

test.beforeEach(async ({ page }, testInfo) => {
  await login(page);

  await navigateToKafkaList(page);

  await page.waitForSelector('[role=progressbar]', { state: 'detached', timeout: config.kafkaInstanceCreationTimeout });

  for (const el of await page.locator(`tr >> a`).elementHandles()) {
    const name = await el.textContent();
    await deleteKafkaInstance(page, name);
  }
});

// test_3kas.py test_kas_kafka_check_does_not_exist
test('check there are no Kafka instances', async ({ page }) => {
  await expect(page.getByText('No Kafka instances')).toHaveCount(1);
});

// test_3kas.py test_kas_kafka_create_dont_wait_for_ready_delete_wait_for_delete
test('create and delete a Kafka instance', async ({ page }) => {
  const testInstanceName = `test-instance-${config.sessionID}`;

  await createKafkaInstance(page, testInstanceName);
  await deleteKafkaInstance(page, testInstanceName);
});

// test_3kas.py test_kas_kafka_create_wait_for_ready_delete_wait_for_delete
test('create, wait for ready and delete a Kafka instance', async ({ page }) => {
  const testInstanceName = `test-instance-${config.sessionID}`;

  await createKafkaInstance(page, testInstanceName);
  await waitForKafkaReady(page, testInstanceName);
  await deleteKafkaInstance(page, testInstanceName);
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

const filterByStatus = async function (page, status) {
  if ((await page.getByRole('button', { name: 'Clear all filters' }).count()) > 0) {
    await page.getByRole('button', { name: 'Clear all filters' }).click();
  }
  await page.getByTestId('large-viewport-toolbar').locator('[aria-label="Options menu"]').click();

  await page.locator('button[role="option"]:has-text("Status")').click();
  await page.getByTestId('large-viewport-toolbar').getByText('Filter by status').click();

  await page.getByLabel(status).check(true);

  await page.getByTestId('large-viewport-toolbar').getByText('Filter by status').click();
}

// test_3kas.py test_kas_kafka_filter_by_status
test('test Kafka list filtered by status', async ({ page }) => {
  const testInstanceName = `test-instance-${config.sessionID}`;

  await createKafkaInstance(page, testInstanceName);
  await expect(page.getByText(testInstanceName)).toBeVisible();

  await filterByStatus(page, 'Suspended');
  await expect(page.getByText('No results found')).toHaveCount(1);

  await filterByStatus(page, 'Creating');
  await expect(page.getByText(testInstanceName)).toBeTruthy();

  await waitForKafkaReady(page, testInstanceName);

  await filterByStatus(page, 'Ready');
  await expect(page.getByText(testInstanceName)).toBeTruthy();

  await deleteKafkaInstance(page, testInstanceName, false);

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
  const testInstanceName = `test-instance-${config.sessionID}`;
  await createKafkaInstance(page, testInstanceName, false);
  
  await page.getByText('Create Kafka instance').click();

  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);

  await page.getByLabel('Name *').fill(testInstanceName);

  await page.getByTestId('modalCreateKafka-buttonSubmit').click();

  await expect(page.getByText(`${testInstanceName} already exists. Please try a different name.`)).toHaveCount(1);

  await page.locator('#modalCreateKafka > button').click();

  await deleteKafkaInstance(page, testInstanceName);
});
