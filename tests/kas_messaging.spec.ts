import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToKafkaList, deleteKafkaInstance, createKafkaInstance, getBootstrapUrl, navigateToAccess, manageAccess, navigateToConsumerGroups, grantProducerAccess, grantConsumerAccess } from '@lib/kafka';
import { navigateToKafkaTopicsList, createKafkaTopic, deleteKafkaTopic } from '@lib/topic';
import { KafkaConsumer, KafkaProducer } from '../lib/clients'
import { strict as assert } from 'assert';
import { createServiceAccount, deleteServiceAccount, navigateToSAList } from '@lib/sa';

// const testInstanceName = `test-instance-${config.sessionID}`;
// const testTopicName = `test-topic-${config.sessionID}`;

const testInstanceName = `jakub-test`;
const testTopicName = `test-jstejska`;
const testServiceAccountName = "jstejska-test";
let credentials;

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

  await navigateToSAList(page)
  await expect(page.getByText('Create service account')).toHaveCount(1);
  if ((await page.locator('tr', { hasText: testServiceAccountName }).count()) !== 0 ) {
    await deleteServiceAccount(page, testServiceAccountName)
  }
  credentials = await createServiceAccount(page, testServiceAccountName)

});

// test_6messages.py generate_messages_to_topic
test('Generate messages to topic', async({ page }) => {
  const consumerGroupId = "test"
  const expectedMessageCount = 100

  const bootstrap = await getBootstrapUrl(page, testInstanceName)

  await navigateToAccess(page, testInstanceName);
  await grantProducerAccess(page, credentials.clientID, testTopicName);
  await grantConsumerAccess(page, credentials.clientID, testTopicName, consumerGroupId);

  // Producer 100 messages
  const producer = new KafkaProducer(bootstrap, credentials.clientID, credentials.clientSecret)
  let producerResponse = await producer.produceMessages(testTopicName, expectedMessageCount, "key")
  assert(producerResponse === true)

  // Consume 100 messages
  const consumer = new KafkaConsumer(bootstrap, consumerGroupId, credentials.clientID, credentials.clientSecret)
  let consumerResponse = await consumer.consumeMessages(testTopicName, expectedMessageCount)
  assert(consumerResponse === true)

  // Open Consumer Groups Tab to check dashboard
  await navigateToConsumerGroups(page);
  expect(await page.getByText(consumerGroupId).count() >= 1);
  // Shutdown producer
  await consumer.shutdown()
})

// // test_6messages.py browse_messages
// test('Browse messages', async({page}) => {
//   await navigeToMessages(page, testTopicName)
// })

// // test_6messages.py filter_messages
// test('Filter messages', async({page}) => {
//   await navigeToMessages(page, testTopicName)
// })