import { expect } from '@playwright/test';
import { test } from '@lib/utils/fixtures';
import { config } from '@lib/config';
import { KafkaInstanceListPage } from '@lib/pom/streams/kafkaInstanceList';
import { TopicListPage } from '@lib/pom/streams/instance/topicList';
import { ServiceAccountPage } from '@lib/pom/serviceAccounts/sa';
import { AccessPage } from '@lib/pom/streams/instance/access';
import { AbstractPage } from '@lib/pom/abstractPage';
import { ConsumerGroupsPage } from '@lib/pom/streams/instance/consumerGroups';
import { PropertiesPage } from '@lib/pom/streams/instance/topic/properties';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';
import { TopicPage } from '@lib/pom/streams/instance/topic';
import { sleep } from '@lib/utils/sleep';

const testInstanceName = config.instanceName;
const testTopicName = `test-topic-${config.sessionID}`;

// Use admin user context
test.use({ storageState: config.adminAuthFile });

test.beforeEach(async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);

  await kafkaInstancesPage.gotoThroughMenu();

  if ((await kafkaInstancesPage.noKafkaInstancesText.count()) == 1) {
    await kafkaInstancesPage.createKafkaInstance(testInstanceName);
    await kafkaInstancesPage.waitForKafkaReady(testInstanceName);
  } else {
    // Test instance present, nothing to do!
    try {
      await expect(page.getByText(testInstanceName)).toHaveCount(1, { timeout: 2000 });
    } catch (e) {
      await kafkaInstancesPage.createKafkaInstance(testInstanceName);
      await kafkaInstancesPage.waitForKafkaReady(testInstanceName);
    }
  }
});

test.afterEach(async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
});

test.afterAll(async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  const kafkaInstancesPage = new KafkaInstanceListPage(page);

  await serviceAccountPage.deleteAllServiceAccounts();
  await kafkaInstancesPage.deleteAllKafkas();
});

// test_3kas.py test_number_of_shown_kafka_instances
// & test_4kafka.py test_kafka_consumer_groups_empty & test_kafka_access_default
test('test shown Kafka instances and check access and consumer groups default', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const consumerGroupsPage = new ConsumerGroupsPage(page, testInstanceName);
  const accessPage = new AccessPage(page, testInstanceName);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await consumerGroupsPage.gotoThroughMenu();
  await consumerGroupsPage.waitForEmptyConsumerGroupsTable();

  await expect(consumerGroupsPage.consumerGroupHeading).toHaveCount(1);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await accessPage.gotoThroughMenu();
  await expect(page.locator('th', { hasText: 'Account' })).toHaveCount(1);
  await expect(page.locator('th', { hasText: 'Permission' })).toHaveCount(1);
  await expect(page.locator('th', { hasText: 'Resource' })).toHaveCount(1);
});

// test_3kas.py test_try_to_create_second_kafka_instance
test('test fail to create a second Kafka instance', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
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
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
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
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
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
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
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
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await page.locator('button', { hasText: 'Region' }).click();
  await expect(page.getByText(testInstanceName)).toBeTruthy();
});

// test_3kas.py test_kas_kafka_filter_by_cloud_provider
// TODO: cloud provider can only be ordered, not filtered ???
test('test instances can be filtered by cloud provider', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await page.locator('button', { hasText: 'Cloud provider' }).click();
  await expect(page.getByText(testInstanceName)).toBeTruthy();
});

// test_3kas.py test_kas_kafka_view_details_by_row_click_panel_opened
test('test instance details on row click', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();

  await page.locator('tr', { hasText: `${testInstanceName}` }).click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
});

// test_3kas.py test_kas_kafka_view_details_by_menu_click_panel_opened
test('test instance details on menu click', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancesPage.showElementActions(testInstanceName);

  await kafkaInstancesPage.detailsButton.click();

  await expect(page.locator('h1', { hasText: `${testInstanceName}` })).toHaveCount(1);
  await expect(kafkaInstancesPage.detailsButton).toHaveCount(1);

  await page.locator('button[aria-label="Close drawer panel"]').click();
});

// test_3kas.py test_kas_kafka_view_details_by_connection_menu_click_panel_opened
// ... and more ...
test('test instance quick options', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancesPage.showElementActions(testInstanceName);

  await page.locator('button', { hasText: 'Connection' }).click();

  await expect(kafkaInstancesPage.bootstrapField).toHaveCount(1);

  await page.locator('button[aria-label="Close drawer panel"]').click();

  await kafkaInstancesPage.showElementActions(testInstanceName);
  await page.getByRole('menuitem', { name: 'Change owner' }).click();

  await expect(page.getByText('Current owner')).toHaveCount(1);
  await expect(page.getByRole('dialog', { name: 'Change owner' }).getByText(config.adminUsername)).toHaveCount(1);

  await page.getByRole('button', { name: 'Cancel' }).click();
});

// test_4kas.py test_kafka_dashboard_opened & test_kafka_dashboard_default
test('test instance dashboard on instance name click', async ({ page }) => {
  const kafkaInstancesListPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);

  await kafkaInstancesListPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();

  await expect(kafkaInstancePage.kafkaInstanceHeading).toHaveCount(1);
  await expect(kafkaInstancePage.kafkaTabNavDashboard).toHaveCount(1);

  await expect(page.locator('h3', { hasText: 'Topics' })).toHaveCount(1);
  await expect(page.locator('h3', { hasText: 'Topic partitions' })).toHaveCount(1);
  await expect(page.locator('h3', { hasText: 'Consumer groups' })).toHaveCount(1);
  await expect(page.locator('h3', { hasText: '0' })).toHaveCount(3);
});

// test_4kafka.py test_kafka_topic_check_does_not_exist & test_kafka_topics_opened & test_kafka_topic_create
test('check Topic does not exist and create and delete', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicListPage(page, testInstanceName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicPage.gotoThroughMenu();

  await expect(page.locator('h2', { hasText: 'No topics' })).toBeVisible();
  await expect(topicPage.createTopicButton).toBeVisible();
  // expecting not to find topic row
  await expect(page.locator('td', { hasText: `${testTopicName}` })).toHaveCount(0);

  await topicPage.gotoThroughMenu();
  await topicPage.createKafkaTopic(testTopicName, true);
  await topicPage.deleteKafkaTopic(testTopicName);
});

// test_4kafka.py test_kafka_try_create_topic_with_same_name
test('test kafka try create topic with same name', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicListPage(page, testInstanceName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();

  await topicPage.gotoThroughMenu();
  await topicPage.createKafkaTopic(testTopicName, true);
  await expect(page.locator('tr', { hasText: `${testTopicName}` })).toHaveCount(1);
  await topicPage.createTopicButton.click();
  await page.getByPlaceholder('Enter topic name').fill(testTopicName);
  // https://issues.redhat.com/browse/MGDX-386
  await page.getByPlaceholder('Enter topic name').click();
  await sleep(2000);
  await page.locator('button', { hasText: 'Next' }).click();
  await expect(page.getByText('already exists. Try a different name')).toBeVisible();
});

test('create Topic with properties different than default', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicListPage = new TopicListPage(page, testInstanceName);
  const topicPage = new TopicPage(page, testInstanceName, testTopicName);
  const propertiesPage = new PropertiesPage(page, testInstanceName, testTopicName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicListPage.gotoThroughMenu();

  await topicListPage.createKafkaTopic(testTopicName, false);
  await topicPage.gotoThroughMenu();

  await propertiesPage.gotoThroughMenu();
  // Checking phase
  await expect(await propertiesPage.partitionsInput.getAttribute('value')).not.toBe(1);

  const rt = await propertiesPage.retentionTimeInput.getAttribute('value');
  expect(rt).not.toMatch(/604800000 ms \(7 days\)/);

  const rs = await propertiesPage.retentionSizeInput.getAttribute('value');
  expect(rs).not.toMatch(/Unlimited/);

  const cp = await propertiesPage.cleanupPolicyInput.getAttribute('value');
  expect(cp).not.toMatch(/delete/);

  // Topic CleanUp
  await topicPage.deleteTopicLink.click();
  await topicListPage.deleteNameInput.fill(testTopicName);
  await topicListPage.deleteButton.click();
});

// test_4kafka.py test_edit_topic_properties_after_creation
test('edit topic properties after creation', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicListPage = new TopicListPage(page, testInstanceName);
  const topicPage = new TopicPage(page, testInstanceName, testTopicName);
  const propertiesPage = new PropertiesPage(page, testInstanceName, testTopicName);
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicListPage.gotoThroughMenu();

  await topicListPage.createKafkaTopic(testTopicName, true);

  const row = page.locator('tr', { hasText: testTopicName });
  await row.locator(AbstractPage.actionsLocatorString).click();
  await page.getByText('Edit topic configuration').click();

  // we wait 3 seconds to fetch the data
  await expect(propertiesPage.numPartitionsInput).toHaveValue('1', { timeout: 3000 });
  const numPartitionsBefore: string = await propertiesPage.numPartitionsInput.getAttribute('value');
  console.log('Number of partitions by default: ' + numPartitionsBefore);
  for (let i = 0; i < 2; i++) {
    await propertiesPage.numPartitionsButton.nth(1).click();
  }
  await propertiesPage.numPartitionsButton.nth(0).click();
  // we check the value has been changed
  await expect(propertiesPage.numPartitionsInput).not.toHaveValue(numPartitionsBefore);

  // Retention Time
  await expect(propertiesPage.retentionOptionField).toHaveCount(1);
  const retentionTimeBefore = await propertiesPage.retentionMsField.getAttribute('value');
  await propertiesPage.daysButton.click();
  await propertiesPage.hoursButton.click();
  await propertiesPage.retentionMsField.click();
  await propertiesPage.retentionMsField.fill('666');
  await expect(propertiesPage.retentionMsField).not.toHaveValue(retentionTimeBefore);

  // Retention Size
  const retentionSizeBefore = await propertiesPage.retentionBytesField.getAttribute('value');
  await propertiesPage.bytesRadioButton.check();
  await propertiesPage.bytesButton.click();
  await propertiesPage.kibibytesButton.click();
  await propertiesPage.retentionBytesField.click();
  await propertiesPage.retentionBytesField.fill('666');
  await expect(propertiesPage.retentionBytesField).not.toHaveValue(retentionSizeBefore);

  // CleanUp Policy
  await propertiesPage.deleteButton.click();
  await propertiesPage.compactButton.first().click();

  await propertiesPage.saveButton.click();

  // await expect(page.getByText('Increase the number of partitions?')).toHaveCount(1);
  // await page.getByRole('button', { name: 'Yes' }).click();
  await page.waitForSelector(AbstractPage.progressBarLocatorString, {
    state: 'detached'
  });
  await expect(topicListPage.createTopicButton).toHaveCount(1);

  // Here we begin the comparison
  await topicPage.gotoThroughMenu();
  await propertiesPage.gotoThroughMenu();

  const numPartitionsAfter: string = await propertiesPage.partitionsInput.getAttribute('value');
  console.log('numPartitionsAfter: ' + numPartitionsAfter);
  expect(numPartitionsAfter).not.toBe(numPartitionsBefore);

  const rt = await propertiesPage.retentionTimeInput.getAttribute('value');
  expect(rt).toMatch(/2397600000 ms \(666 hours\)/);

  const rs = await propertiesPage.retentionSizeInput.getAttribute('value');
  expect(rs).toMatch(/681984 bytes \(666 kibibytes\)/);

  const cp = await propertiesPage.cleanupPolicyInput.getAttribute('value');
  expect(cp).not.toMatch(/Delete/);

  // Topic CleanUp
  await topicPage.deleteTopicLink.click();
  await topicListPage.deleteNameInput.fill(testTopicName);
  await topicListPage.deleteButton.click();
});
