import { expect } from '@playwright/test';
import { test } from '@lib/utils/fixtures';
import { config } from '@lib/config';
import { KafkaInstanceListPage } from '@lib/pom/streams/kafkaInstanceList';
import { KafkaConsumer, KafkaProducer } from '@lib/utils/clients';
import { ServiceAccountPage } from '@lib/pom/serviceAccounts/sa';
import { retry } from '@lib/utils/common';
import { TopicListPage } from '@lib/pom/streams/instance/topicList';
import { AccessPage } from '@lib/pom/streams/instance/access';
import { ConsumerGroupsPage } from '@lib/pom/streams/instance/consumerGroups';
import { MessagesPage } from '@lib/pom/streams/instance/topic/messages';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';
import { TopicPage } from '@lib/pom/streams/instance/topic';
import { FilterGroup, Limit } from '@lib/enums/messages';

const testInstanceName = config.instanceName;
const testTopicName = `test-topic-name-${config.sessionID}`;
const testServiceAccountPrefix = `test-messaging-sa-${config.sessionID}-`;
const testMessageKey = 'key';
const consumerGroupId = `test-cg-${config.sessionID}`;
const expectedMessageCount = 100;
const reconnectCount = 5;
const reconnectDelayMs = 500;
let testServiceAccountName;
let credentials;
let bootstrap: string;

test.use({ storageState: config.adminAuthFile });

test.beforeEach(async ({ page }) => {
  testServiceAccountName = `${testServiceAccountPrefix}${Date.now()}`;
  const serviceAccountPage = new ServiceAccountPage(page);
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicPage = new TopicListPage(page, testInstanceName);
  const accessPage = new AccessPage(page, testInstanceName);

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

  await kafkaInstancePage.gotoThroughMenu();
  await topicPage.gotoThroughMenu();
  // Do not create topic if it already exists
  // TODO - implement this in POM somehow
  await expect(page.getByText('Create topic')).toHaveCount(1);
  await expect(page.getByText('Loading content')).toHaveCount(0);
  if ((await page.locator('a', { hasText: testTopicName }).count()) === 0) {
    await topicPage.createKafkaTopic(testTopicName, true);
  }

  await serviceAccountPage.gotoThroughMenu();
  credentials = await serviceAccountPage.createServiceAccount(testServiceAccountName);
  await kafkaInstancesPage.gotoThroughMenu();
  bootstrap = await kafkaInstancesPage.getBootstrapUrl(testInstanceName);

  await kafkaInstancePage.gotoThroughMenu();
  await accessPage.gotoThroughMenu();
  await accessPage.grantProducerAccess(credentials.clientID, testTopicName);

  // Producer 100 messages
  const producer = new KafkaProducer(bootstrap, credentials.clientID, credentials.clientSecret);
  const producerResponse = await retry(
    () => producer.produceMessages(testTopicName, expectedMessageCount, testMessageKey),
    reconnectCount,
    reconnectDelayMs
  );
  expect(producerResponse === true).toBeTruthy();
});

test.afterEach(async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  await serviceAccountPage.deleteAllServiceAccounts();
  const accessPage = new AccessPage(page, testInstanceName);
  await accessPage.gotoFromAnywhere();
  await accessPage.revokeAccess(credentials.clientID, '', '', true);
});

test.afterAll(async ({ page }) => {
  const serviceAccountPage = new ServiceAccountPage(page);
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  await serviceAccountPage.deleteAllServiceAccounts();
  await kafkaInstancesPage.deleteAllKafkas();
});

// test_6messages.py generate_messages_to_topic
test('Consume messages from topic', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const consumerGroupsPage = new ConsumerGroupsPage(page, testInstanceName);
  const accessPage = new AccessPage(page, testInstanceName);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await accessPage.gotoThroughMenu();
  await accessPage.grantConsumerAccess(credentials.clientID, testTopicName, consumerGroupId);

  // Consume 100 messages
  const consumer = new KafkaConsumer(bootstrap, consumerGroupId, credentials.clientID, credentials.clientSecret);
  const consumerResponse = await retry(
    () => consumer.consumeMessages(testTopicName, expectedMessageCount),
    reconnectCount,
    reconnectDelayMs
  );
  expect(consumerResponse).toEqual(expectedMessageCount);

  // Open Consumer Groups Tab to check dashboard
  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await consumerGroupsPage.gotoThroughMenu();
  await consumerGroupsPage.waitForFilledConsumerGroupsTable();
  await expect(page.getByText(consumerGroupId)).toHaveCount(1);
});

// test_6messages.py browse_messages
test('Browse messages', async ({ page }) => {
  const kafkaInstancesPage = new KafkaInstanceListPage(page);
  const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
  const topicsPage = new TopicListPage(page, testInstanceName);
  const topicPage = new TopicPage(page, testInstanceName, testTopicName);
  const messagesPage = new MessagesPage(page, testInstanceName, testTopicName);

  await kafkaInstancesPage.gotoThroughMenu();
  await kafkaInstancePage.gotoThroughMenu();
  await topicsPage.gotoThroughMenu();
  await topicPage.gotoThroughMenu();
  await messagesPage.gotoThroughMenu();

  await messagesPage.refreshMessages();

  await expect(page.locator('table[aria-label="Messages table"]')).toContainText('value-' + testMessageKey);
  await expect(page.locator('table[aria-label="Messages table"]')).toContainText('key-' + testMessageKey);
  await page.locator('table[aria-label="Messages table"] >> tr').nth(1).click();
  const messageDetail = await page.locator('data-testid=message-details');
  await expect(messageDetail.locator('dt:has-text("Offset")')).toHaveCount(1);
  await expect(messageDetail.locator('dd:has-text("key-")')).toHaveCount(1);
});

const filters = [FilterGroup.offset, FilterGroup.timestamp, FilterGroup.epoch, FilterGroup.latest];
for (const filter of filters) {
  test(`Filter messages by ${filter}`, async ({ page }) => {
    // Today and tomorrow date
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const kafkaInstancesPage = new KafkaInstanceListPage(page);
    const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
    const topicsPage = new TopicListPage(page, testInstanceName);
    const topicPage = new TopicPage(page, testInstanceName, testTopicName);
    const messagesPage = new MessagesPage(page, testInstanceName, testTopicName);

    await kafkaInstancesPage.gotoThroughMenu();
    await kafkaInstancePage.gotoThroughMenu();
    await topicsPage.gotoThroughMenu();
    await topicPage.gotoThroughMenu();
    await messagesPage.gotoThroughMenu();

    await messagesPage.refreshMessages();
    const messageTable = page.locator('table[aria-label="Messages table"] >> tbody >> tr');

    switch (filter) {
      case FilterGroup.offset: {
        await messagesPage.pickFilterOption(FilterGroup.offset);
        await messagesPage.filterMessagesByOffset('0', '20', Limit.ten);

        // Check that 1st message has offset 20
        await messageTable.nth(0).locator('td[data-label="Offset"]');
        await expect(messageTable.nth(0).locator('td[data-label="Offset"]')).toContainText('20');
        // Check size of the table
        await expect(await messageTable.count()).toBe(Limit.ten);

        // Set offset to 13 and limit to 50
        await messagesPage.filterMessagesByOffset('0', '13', Limit.fifty);
        // messageTable = await page.locator('table[aria-label="Messages table"] >> tbody >> tr');

        // Check that 1st message has offset 13
        await expect(messageTable.nth(0).locator('td[data-label="Offset"]')).toContainText('13');
        await expect(await messageTable.count()).toBe(Limit.fifty);
        break;
      }
      case FilterGroup.timestamp: {
        // Skip FilterByTimestamp test meanwhile there is reported Bug https://issues.redhat.com/browse/MGDSTRM-10574
        test.skip();
        await messagesPage.pickFilterOption(FilterGroup.timestamp);
        await messagesPage.setTimestamp(today.toISOString().slice(0, 10));
        await messagesPage.applyFilter();
        // Check that messages are in the table
        await expect(await messageTable.count()).toBeGreaterThan(0);

        // Set epoch timestam to tomorrow and check that table is empty
        await messagesPage.setTimestamp(tomorrow.toISOString().slice(0, 10));
        await messagesPage.applyFilter();
        await expect(await page.getByText('No messages data')).toHaveCount(1);
        // await expectMessageTableIsEmpty(page);
        await expect(messageTable).toHaveCount(1);
        break;
      }
      case FilterGroup.epoch: {
        await messagesPage.pickFilterOption(FilterGroup.epoch);
        await messagesPage.setEpoch(today.getTime());
        await messagesPage.applyFilter();
        // Check that messages are in the table
        await expect(await messageTable.count()).toBeGreaterThan(0);

        // Set epoch timestam to tomorrow and check that table is empty
        // Tomorrow's epoch doesn't work -> https://issues.redhat.com/browse/MGDX-294
        // await setEpoch(page, tomorrow.getTime());
        // await applyFilter(page);
        // await expect(await page.getByText("No messages data")).toHaveCount(1)
        // await expectMessageTableIsEmpty(page)
        break;
      }
      case FilterGroup.latest: {
        await messagesPage.pickFilterOption(FilterGroup.latest);
        await messagesPage.setPartition('0');
        await messagesPage.setLimit(Limit.twenty);
        await messagesPage.applyFilter();
        await expect(await messageTable.count()).toBeGreaterThan(0);
        break;
      }
    }
  });
}
