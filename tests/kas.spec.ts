import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';

const navigateToKafkaList = async function (page) {
  await page.getByRole('link', { name: 'Application and Data Services' }).click();
  // }
  await page.getByRole('button', { name: 'Streams for Apache Kafka' }).click();
  await page.getByRole('link', { name: 'Kafka Instances' }).click();
  await expect(page.getByRole('heading', { name: 'Kafka Instances' })).toHaveCount(1);
};

const createKafkaInstance = async function (page, name) {
  await page.getByText('Create Kafka instance').click();

  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);
  await page.getByLabel('Name *').fill(name);

  await page.waitForSelector('[role=progressbar]', { state: 'detached' });

  await page.getByTestId('modalCreateKafka-buttonSubmit').click();

  // check for the instance to have been created
  const table = await page.locator('[data-ouia-component-id=table-kafka-instances]');
  await expect(table.getByText(name)).toBeTruthy();
  await expect.soft(page.getByText('Creating')).toHaveCount(1);
};

const deleteKafkaInstance = async function (page, name) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();

  await page.getByText('Delete instance').click();

  try {
    await expect(page.locator('input[name="mas-name-input"]')).toHaveCount(1, {
      timeout: 1000
    });
    await page.locator('input[name="mas-name-input"]').fill(name);
  } catch (err) {
    // Removal without confirmation
    // ignore
  }
  await page.getByTestId('modalDeleteKafka-buttonDelete').click();

  // await for the instance to be deleted
  await expect(page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
    timeout: config.kafkaInstanceDeletionTimeout
  });
};

const waitForKafkaReady = async function (page, name) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });
  await expect(row.getByText('Ready')).toHaveCount(1, {
    timeout: config.kafkaInstanceCreationTimeout
  });
};

test.beforeEach(async ({ page }, testInfo) => {
  await login(page);

  await navigateToKafkaList(page);

  await page.waitForSelector('[role=progressbar]', { state: 'detached' });

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

// TODO: next
// // test_3kas.py test_kas_kafka_filter_by_status
// test('test Kafka list filtered by status', async ({ page }) => {
//   const testInstanceName = `test-instance-${config.sessionID}`;

//   await createKafkaInstance(page, testInstanceName);

//   await waitForKafkaReady(page, testInstanceName);
// });
