import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import {
  navigateToKafkaList,
  deleteKafkaInstance,
  createKafkaInstance,
  getBootstrapUrl,
  navigateToAccess,
  navigateToConsumerGroups,
  grantProducerAccess,
  grantConsumerAccess
} from '@lib/kafka';
import { navigateToKafkaTopicsList, createKafkaTopic, navigateToMessages, refreshMessages } from '@lib/topic';
import { KafkaConsumer, KafkaProducer } from '@lib/clients';
import { createServiceAccount, deleteServiceAccount, navigateToSAList } from '@lib/sa';

const testInstanceName = 'test-instance-messaging';
const testTopicName = `test-topic-name`;
const testServiceAccountName = 'test-service-account';
const testMessageKey = 'key';
const consumerGroupId = 'test-consumer-group';
const expectedMessageCount = 100;
let credentials;
let bootstrap: string;

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

  await navigateToKafkaTopicsList(page, testInstanceName);
  // Do not create topic if it already exists
  await expect(page.getByText('Create topic')).toHaveCount(1);
  if ((await page.locator('a', { hasText: testTopicName }).count()) === 0) {
    await createKafkaTopic(page, testTopicName);
  }

  await navigateToSAList(page);
  await expect(page.getByText('Create service account')).toHaveCount(1);
  if ((await page.locator('tr', { hasText: testServiceAccountName }).count()) !== 0) {
    await deleteServiceAccount(page, testServiceAccountName);
  }
  credentials = await createServiceAccount(page, testServiceAccountName);
  bootstrap = await getBootstrapUrl(page, testInstanceName);

  await navigateToAccess(page, testInstanceName);
  await grantProducerAccess(page, credentials.clientID, testTopicName);

  // Producer 100 messages
  const producer = new KafkaProducer(bootstrap, credentials.clientID, credentials.clientSecret);
  const producerResponse = await producer.produceMessages(testTopicName, expectedMessageCount, testMessageKey);
  expect(producerResponse === true).toBeTruthy();
});

// test_6messages.py generate_messages_to_topic
test('Consume messages from topic', async ({ page }) => {
  await navigateToAccess(page, testInstanceName);
  await grantConsumerAccess(page, credentials.clientID, testTopicName, consumerGroupId);

  // Consume 100 messages
  const consumer = new KafkaConsumer(bootstrap, consumerGroupId, credentials.clientID, credentials.clientSecret);
  const consumerResponse = await consumer.consumeMessages(testTopicName, expectedMessageCount);
  expect(consumerResponse).toEqual(expectedMessageCount);

  // Open Consumer Groups Tab to check dashboard
  await navigateToConsumerGroups(page);
  await expect(await page.getByText(consumerGroupId)).toHaveCount(1);
});

// test_6messages.py browse_messages
test('Browse messages', async ({ page }) => {
  await navigateToMessages(page, testInstanceName, testTopicName);

  await refreshMessages(page);

  await expect(page.locator('table[aria-label="Messages table"]')).toContainText('value-' + testMessageKey);
  await expect(page.locator('table[aria-label="Messages table"]')).toContainText('key-' + testMessageKey);
  await page.locator('table[aria-label="Messages table"] >> tr').nth(1).click();
  const messageDetail = await page.locator('data-testid=message-details');
  await expect(messageDetail.locator('dt:has-text("Offset")')).toHaveCount(1);
  await expect(messageDetail.locator('dd:has-text("key-")')).toHaveCount(1);
});
