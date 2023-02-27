import { test, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { config } from '@lib/config';
import { KafkaInstancesPage } from '@lib/pom/streams/kafkaInstances';
import { TopicsPage } from '@lib/pom/streams/instance/topics';
import { ServiceAccountPage } from '@lib/pom/serviceAccounts/sa';
import { AccessPage } from '@lib/pom/streams/instance/access';
import { AbstractPage } from '@lib/pom/abstractPage';
import { ConsumerGroupsPage } from '@lib/pom/streams/instance/consumerGroups';
import { PropertiesPage } from '@lib/pom/streams/instance/topic/properties';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';

const testInstanceName = config.instanceName;
const testTopicName = `test-topic-${config.sessionID}`;

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

test.afterEach(async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicsPage(page, testInstanceName);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicPage.gotoThroughMenu();

  await page.waitForSelector(AbstractPage.progressBarLocatorString, {
    state: 'detached'
  });
  for (const el of await page.locator(`tr >> a`).elementHandles()) {
    const name = await el.textContent();
    await topicPage.deleteKafkaTopic(name);
  }
});

test.afterAll(async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  const kafkaInstancesPage = new KafkaInstancesPage(page);

  await serviceAccountPage.deleteAllServiceAccounts();
  await kafkaInstancesPage.deleteAllKafkas();
});

// test_3kas.py test_number_of_shown_kafka_instances
// & test_4kafka.py test_kafka_consumer_groups_empty & test_kafka_access_default
test('test shown Kafka instances and check access and consumer groups default', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const consumerGroupsPage = new ConsumerGroupsPage(page, testInstanceName);
  const accessPage = new AccessPage(page, testInstanceName);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await consumerGroupsPage.gotoThroughMenu();

  await expect(page.locator('h2', { hasText: 'No consumer groups' })).toHaveCount(1);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await accessPage.gotoThroughMenu();
  await expect(page.locator('th', { hasText: 'Account' })).toHaveCount(1);
  await expect(page.locator('th', { hasText: 'Permission' })).toHaveCount(1);
  await expect(page.locator('th', { hasText: 'Resource' })).toHaveCount(1);
});

// test_3kas.py test_try_to_create_second_kafka_instance
test('test fail to create a second Kafka instance', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

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

  await page.getByTestId('large-viewport-toolbar').getByPlaceholder('Filter by name').click();
  await page.getByTestId('large-viewport-toolbar').getByPlaceholder('Filter by name').fill(name);

  if (!skipClick) {
    await page.getByRole('button', { name: 'Search' }).click();
  }
};

// test_3kas.py test_kas_kafka_filter_by_name
test('test instances can be filtered by name', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

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
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  if ((await page.getByRole('button', { name: 'Clear all filters' }).count()) > 0) {
    await page.getByRole('button', { name: 'Clear all filters' }).click();
  }
  await page.getByTestId('large-viewport-toolbar').locator('[aria-label="Options menu"]').click();

  await page.locator('button[role="option"]:has-text("Owner")').click();

  await page.getByTestId('large-viewport-toolbar').getByPlaceholder('Filter by owner').click();
  await page.getByTestId('large-viewport-toolbar').getByPlaceholder('Filter by owner').fill(name);

  if (!skipClick) {
    await page.getByRole('button', { name: 'Search' }).click();
  }
};

// test_3kas.py test_kas_kafka_filter_by_owner
test('test instances can be filtered by owner', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

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
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await page.locator('button', { hasText: 'Region' }).click();
  await expect(page.getByText(testInstanceName)).toBeTruthy();
});

// test_3kas.py test_kas_kafka_filter_by_cloud_provider
// TODO: cloud provider can only be ordered, not filtered ???
test('test instances can be filtered by cloud provider', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await page.locator('button', { hasText: 'Cloud provider' }).click();
  await expect(page.getByText(testInstanceName)).toBeTruthy();
});

// test_3kas.py test_kas_kafka_view_details_by_row_click_panel_opened
test('test instance details on row click', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await page.getByRole('gridcell', { name: `${config.adminUsername}` }).click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
});

// test_3kas.py test_kas_kafka_view_details_by_menu_click_panel_opened
test('test instance details on menu click', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancesPage.showElementActions(testInstanceName);

  await page.locator('button', { hasText: 'Details' }).click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
  await expect(page.locator('button', { hasText: 'Details' })).toHaveCount(1);

  await page.locator('button[aria-label="Close drawer panel"]').click();
});

// test_3kas.py test_kas_kafka_view_details_by_connection_menu_click_panel_opened
// ... and more ...
test('test instance quick options', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancesPage.showElementActions(testInstanceName);

  await page.locator('button', { hasText: 'Connection' }).click();

  await expect(page.getByRole('textbox', { name: 'Bootstrap server' })).toHaveCount(1);

  await page.locator('button[aria-label="Close drawer panel"]').click();

  await kafkaInstancesPage.showElementActions(testInstanceName);
  await page.getByRole('menuitem', { name: 'Change owner' }).click();

  await expect(page.getByText('Current owner')).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Change owner' }).getByText(config.adminUsername)).toHaveCount(1);

  await page.getByRole('button', { name: 'Cancel' }).click();
});

// test_4kas.py test_kafka_dashboard_opened & test_kafka_dashboard_default
test('test instance dashboard on instance name click', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await page.locator('a', { hasText: `${testInstanceName}` }).click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
  await expect(page.locator('button').locator('span', { hasText: 'Dashboard' })).toHaveCount(1);
  await expect(page.locator('h3', { hasText: 'Topics' })).toHaveCount(1);
  await expect(page.locator('h3', { hasText: 'Topic partitions' })).toHaveCount(1);
  await expect(page.locator('h3', { hasText: 'Consumer groups' })).toHaveCount(1);
  await expect(page.locator('h3', { hasText: '0' })).toHaveCount(3);
});

// test_4kafka.py test_kafka_topic_check_does_not_exist & test_kafka_topics_opened & test_kafka_topic_create
test('check Topic does not exist and create and delete', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicsPage(page, testInstanceName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicPage.gotoThroughMenu();

  await expect(page.locator('h2', { hasText: 'No topics' })).toBeVisible();
  await expect(page.locator('button', { hasText: 'Create topic' })).toBeVisible();
  // expecting not to find topic row
  await expect(page.locator('td', { hasText: `${testTopicName}` })).toHaveCount(0);

  await topicPage.gotoThroughMenu();
  await topicPage.createKafkaTopic(testTopicName, true);
  await topicPage.deleteKafkaTopic(testTopicName);
});

// test_4kafka.py test_kafka_try_create_topic_with_same_name
test('test kafka try create topic with same name', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicsPage(page, testInstanceName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();

  await topicPage.gotoThroughMenu();
  await topicPage.createKafkaTopic(testTopicName, true);
  await expect(page.locator('tr', { hasText: `${testTopicName}` })).toHaveCount(1);
  await page.locator('button', { hasText: 'Create topic' }).click();
  await page.getByPlaceholder('Enter topic name').fill(testTopicName);
  await page.locator('button', { hasText: 'Next' }).click();
  await expect(page.getByText(`${testTopicName}` + ' already exists. Try a different name')).toBeVisible();
});

test('create Topic with properties different than default', async ({ page }) => {
  test.fixme(true, 'Test is extremely flaky.');
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicsPage(page, testInstanceName);
  const propertiesPage = new PropertiesPage(page, testInstanceName, testTopicName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicPage.gotoThroughMenu();

  await topicPage.createKafkaTopic(testTopicName, false);

  await propertiesPage.gotoThroughMenu();
  // Checking phase
  await expect(await page.getByLabel('Partitions').getAttribute('value')).not.toBe(1);

  const rt = await page
    .locator(
      'section[role="group"]:has-text("Core configurationBefore deploying your topic, we recommend entering all core co")'
    )
    .getByLabel('Retention time')
    .getAttribute('value');
  expect(rt).not.toMatch('604800000 ms (7 days)');

  const rs = await page.getByLabel('Retention size').getAttribute('value');
  expect(rs).not.toMatch('Unlimited');

  const cp = await page.getByLabel('Cleanup policy').getAttribute('value');
  expect(cp).not.toMatch('delete');

  // Topic CleanUp
  await page.locator('button', { hasText: 'Delete topic' }).click();
  await page.getByLabel('Type DELETE to confirm:').fill('DELETE');
  await page.locator('footer').locator('button', { hasText: 'Delete' }).click();
});

// test_4kafka.py test_edit_topic_properties_after_creation
test('edit topic properties after creation', async ({ page }) => {
  test.fixme(
    true,
    'Test is extremely flaky. Topics are not cleared and we need to wait properly on loading instead of just cliking without it.'
  );
  const kafkaInstancesPage = new KafkaInstancesPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicsPage(page, testInstanceName);
  const propertiesPage = new PropertiesPage(page, testInstanceName, testTopicName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicPage.gotoThroughMenu();

  await topicPage.createKafkaTopic(testTopicName, true);

  const row = page.locator('tr', { hasText: testTopicName });
  await row.locator(AbstractPage.actionsLocatorString).click();
  await page.getByText('Edit topic configuration').click();

  // we wait 3 seconds to fetch the data
  await expect(page.locator('input[name="num-partitions"]')).toHaveValue('1', { timeout: 3000 });
  const numPartitionsBefore: string = await page.locator('input[name="num-partitions"]').getAttribute('value');
  console.log('Number of partitions by default: ' + numPartitionsBefore);
  const numPartitionsButton = page.locator('button[name="num-partitions"]');
  for (let i = 0; i < 2; i++) {
    await numPartitionsButton.nth(1).click();
  }
  await numPartitionsButton.nth(0).click();
  // we check the value has been changed
  await expect(page.locator('input[name="num-partitions"]')).not.toHaveValue(numPartitionsBefore);

  // Retention Time
  await expect(page.locator('label:has-text("days") input[type="number"]')).toHaveCount(1);
  page.locator('label:has-text("days") input[type="number"]').click();
  const retentionTimeBefore = await page.locator('label:has-text("days") input[type="number"]').getAttribute('value');
  const retentionTimeButton = page.locator('button[name="retention-ms"]');
  // we increase by 2 and decrease by 1 to test + & - buttons
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
  // we increase by 2 and decrease by 1 to test + & - buttons
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
  await page.waitForSelector('[role=progressbar]', {
    state: 'detached'
  });
  await expect(page.locator('h2', { hasText: 'No consumer groups' })).toHaveCount(1);

  // Here we begin the comparison
  await propertiesPage.gotoThroughMenu();

  const numPartitionsAfter: string = await page.getByLabel('Partitions').getAttribute('value');
  console.log('numPartitionsAfter: ' + numPartitionsAfter);
  expect(numPartitionsAfter).not.toBe(numPartitionsBefore);

  const rt = await page
    .locator(
      'section[role="group"]:has-text("Core configurationBefore deploying your topic, we recommend entering all core co")'
    )
    .getByLabel('Retention time')
    .getAttribute('value');
  expect(rt).toMatch('28800000 ms (8 hours)');

  const rs = await page.getByLabel('Retention size').getAttribute('value');
  expect(rs).toMatch('2048 bytes (2 kibibytes)');

  const cp = await page.getByLabel('Cleanup policy').getAttribute('value');
  expect(cp).not.toMatch('Delete');

  // Topic CleanUp
  await page.locator('button', { hasText: 'Delete topic' }).click();
  await page.getByLabel('Type DELETE to confirm:').fill('DELETE');
  await page.locator('footer').locator('button', { hasText: 'Delete' }).click();
});
