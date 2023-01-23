import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import {
  navigateToKafkaList,
  deleteKafkaInstance,
  createKafkaInstance,
  waitForKafkaReady,
  showElementActions
} from '@lib/kafka';
import { navigateToKafkaTopicsList, createKafkaTopic, deleteKafkaTopic } from '@lib/topic';

const testInstanceName = config.instanceName;
const testTopicPrefix = 'test-topic-';
const testTopicName = `${testTopicPrefix}${config.sessionID}`;

test.beforeEach(async ({ page }) => {
  await login(page);

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

// test_3kas.py test_number_of_shown_kafka_instances
test('test shown Kafka instances', async ({ page }) => {
  await expect(page.locator('tr')).toHaveCount(2); // title and 1 instance
});

// test_3kas.py test_try_to_create_second_kafka_instance
test('test fail to create a second Kafka instance', async ({ page }) => {
  await page.getByText('Create Kafka instance').click();
  await expect(page.getByText('Create a Kafka instance')).toHaveCount(1);

  await expect(page.getByText('Warning alert:You already have an instance running')).toHaveCount(1);
  await page.locator('#modalCreateKafka > button').click();
});

const filterByName = async function (page, name, skipClick = false) {
  if ((await page.getByRole('button', { name: 'Clear all filters' }).count()) > 0) {
    await page.getByRole('button', { name: 'Clear all filters' }).click();
  }
  await page.getByTestId('large-viewport-toolbar').locator('[aria-label="Options menu"]').click();

  await page.locator('button[role="option"]:has-text("Name")').click();

  await page.getByRole('searchbox', { name: 'Filter by name' }).click();
  await page.getByRole('searchbox', { name: 'Filter by name' }).fill(name);

  if (!skipClick) {
    await page.getByRole('button', { name: 'Search' }).click();
  }
};

// test_3kas.py test_kas_kafka_filter_by_name
test('test instances can be filtered by name', async ({ page }) => {
  await filterByName(page, 'test');
  await expect(page.getByText(testInstanceName)).toBeTruthy();

  await filterByName(page, 'wrong');
  await expect(page.getByText('No results found')).toHaveCount(1);

  await filterByName(page, 'INVALID-SYNTAX#$', true);
  await expect(
    page.getByText('Valid characters include lowercase letters from a to z, numbers from 0 to 9, and')
  ).toHaveCount(1);
});

const filterByOwner = async function (page, name, skipClick = false) {
  if ((await page.getByRole('button', { name: 'Clear all filters' }).count()) > 0) {
    await page.getByRole('button', { name: 'Clear all filters' }).click();
  }
  await page.getByTestId('large-viewport-toolbar').locator('[aria-label="Options menu"]').click();

  await page.locator('button[role="option"]:has-text("Owner")').click();

  await page.getByRole('searchbox', { name: 'Filter by owner' }).click();
  await page.getByRole('searchbox', { name: 'Filter by owner' }).fill(name);

  if (!skipClick) {
    await page.getByRole('button', { name: 'Search' }).click();
  }
};

// test_3kas.py test_kas_kafka_filter_by_owner
test('test instances can be filtered by owner', async ({ page }) => {
  await filterByOwner(page, config.adminUsername.substring(0, 5));
  await expect(page.getByText(testInstanceName)).toBeTruthy();

  await filterByOwner(page, 'wrong');
  await expect(page.getByText('No results found')).toHaveCount(1);

  await filterByOwner(page, 'INVALID-SYNTAX#$', true);
  await expect(
    page.getByText('Valid characters include lowercase letters from a to z, numbers from 0 to 9, and')
  ).toHaveCount(1);
});

// test_3kas.py test_kas_kafka_filter_by_region
// TODO: region can only be ordered, not filtered ???
test('test instances can be filtered by region', async ({ page }) => {
  await page.getByRole('button', { name: 'Region' }).click();
  await expect(page.getByText(testInstanceName)).toBeTruthy();
});

// test_3kas.py test_kas_kafka_filter_by_cloud_provider
// TODO: cloud provider can only be ordered, not filtered ???
test('test instances can be filtered by cloud provider', async ({ page }) => {
  await page.getByRole('button', { name: 'Cloud provider' }).click();
  await expect(page.getByText(testInstanceName)).toBeTruthy();
});

// test_3kas.py test_kas_kafka_view_details_by_row_click_panel_opened
test('test instance details on row click', async ({ page }) => {
  await page.getByRole('gridcell', { name: `${config.adminUsername}` }).click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
});

// test_3kas.py test_kas_kafka_view_details_by_menu_click_panel_opened
test('test instance details on menu click', async ({ page }) => {
  await showElementActions(page, testInstanceName);
  await page.locator('button', { hasText: 'Details' }).click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
  await expect(page.locator('button', { hasText: 'Details' })).toHaveCount(1);

  await page.locator('button[aria-label="Close drawer panel"]').click();
});

// test_3kas.py test_kas_kafka_view_details_by_connection_menu_click_panel_opened
// ... and more ...
test('test instance quick options', async ({ page }) => {
  await showElementActions(page, testInstanceName);
  await page.locator('button', { hasText: 'Connection' }).click();

  await expect(page.getByRole('textbox', { name: 'Bootstrap server' })).toHaveCount(1);

  await page.locator('button[aria-label="Close drawer panel"]').click();

  await showElementActions(page, testInstanceName);
  await page.getByRole('menuitem', { name: 'Change owner' }).click();

  await expect(page.getByText('Current owner')).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Change owner' }).getByText(config.adminUsername)).toHaveCount(1);

  await page.getByRole('button', { name: 'Cancel' }).click();
});

// test_4kas.py test_kafka_dashboard_opened
test('test instance dashboard on instance name click', async ({ page }) => {
  await waitForKafkaReady(page, testInstanceName);
  await page.locator('a', { hasText: `${testInstanceName}` }).click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
  await expect(page.getByTestId('pageKafka-tabDashboard')).toHaveCount(1);
});

// test_4kafka.py test_kafka_topic_create
test('create and delete a Kafka Topic', async ({ page }) => {
  await navigateToKafkaTopicsList(page, testInstanceName);
  await createKafkaTopic(page, testTopicName);
  await deleteKafkaTopic(page, testTopicName);
});

// test_4kafka.py test_edit_topic_properties_after_creation
test('edit topic properties after creation', async ({ page }) => {
  await navigateToKafkaTopicsList(page, testInstanceName);
  await createKafkaTopic(page, testTopicName);

  const row = page.locator('tr', { hasText: testTopicName });
  await row.locator('[aria-label="Actions"]').click();
  await page.getByText('Edit topic configuration').click();

  await expect(page.locator('input[name="num-partitions"]')).toHaveValue('1', { timeout: 3000 });
  const numPartitionsBefore: string = await page.locator('input[name="num-partitions"]').getAttribute('value');
  const numPartitionsButton = page.locator('button[name="num-partitions"]');
  for (let i = 0; i < 2; i++) {
    await numPartitionsButton.nth(1).click();
  }
  await numPartitionsButton.nth(0).click();
  await expect(page.locator('input[name="num-partitions"]')).not.toHaveValue(numPartitionsBefore);

  // Retention Time
  await expect(page.locator('label:has-text("days") input[type="number"]')).toHaveCount(1);
  page.locator('label:has-text("days") input[type="number"]').click();
  const retentionTimeBefore = await page.locator('label:has-text("days") input[type="number"]').getAttribute('value');
  const retentionTimeButton = page.locator('button[name="retention-ms"]');
  for (let i = 0; i < 2; i++) {
    await retentionTimeButton.nth(1).click();
  }
  await retentionTimeButton.nth(0).click();
  await expect(page.locator('label:has-text("days") input[type="number"]')).not.toHaveValue(retentionTimeBefore);

  await page.locator('button:has-text("days")').click();
  await page.locator('button', { hasText: 'hours' }).click();

  // Retention Size
  await expect(page.locator('label:has-text("bytes") input[type="number"]')).toHaveCount(1);
  await page.locator('label:has-text("bytes") input[type="number"]').click();
  const retentionSizeBefore = await page.locator('label:has-text("bytes") input[type="number"]').getAttribute('value');
  const retentionSizeButton = page.locator('button[name="retention-bytes"]');
  for (let i = 0; i < 2; i++) {
    await retentionSizeButton.nth(1).click();
  }
  await retentionSizeButton.nth(0).click();
  await expect(page.locator('label:has-text("bytes") input[type="number"]')).not.toHaveValue(retentionSizeBefore);

  await page.locator('button:has-text("bytes")').click();
  await page.locator('button', { hasText: 'kibibytes' }).click();

  // CleanUp Policy
  await expect(page.locator('button:has-text("Delete")')).toHaveCount(1);
  await page.locator('button:has-text("Delete")').click();
  await page.getByText('Compact').first().click();
  await page.locator('button:has-text("Compact")').click();

  await page.locator('button', { hasText: 'Save' }).click();

  await expect(page.getByText('Increase the number of partitions?')).toHaveCount(1);
  await page.getByRole('button', { name: 'Yes' }).click();

  // Here we begin the comparison
  await expect(page.locator('h1:has-text("' + testTopicName + '")')).toHaveCount(1);
  await page.locator('button', { hasText: 'Properties' }).click();

  await expect(page.getByLabel('Partitions').getAttribute('value')).not.toBe(numPartitionsBefore);

  const rt = await page
    .locator(
      'section[role="group"]:has-text("Core configurationBefore deploying your topic, we recommend entering all core co")'
    )
    .getByLabel('Retention time')
    .getAttribute('value');
  await expect(rt).toMatch('28800000 ms (8 hours)');

  const rs = await page.getByLabel('Retention size').getAttribute('value');
  await expect(rs).toMatch('2048 bytes (2 kibibytes)');

  const cp = await page.getByLabel('Cleanup policy').getAttribute('value');
  await expect(cp).not.toMatch('Delete');

  // Topic CleanUp
  await page.locator('button', { hasText: 'Delete topic' }).click();
  await page.getByLabel('Type DELETE to confirm:').fill('DELETE');
  await page.locator('footer').locator('button', { hasText: 'Delete' }).click();
});
