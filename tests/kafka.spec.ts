import { test } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToKafkaList, deleteKafkaInstance, createKafkaInstance } from '@lib/kafka';
import { navigateToKafkaTopicsList, createKafkaTopic, deleteKafkaTopic } from '@lib/topic';

const testInstanceName = `test-instance-${config.sessionID}`;
const testTopicName = `test-topic-${config.sessionID}`;

test.beforeEach(async ({ page }, testInfo) => {
  await login(page);

  await navigateToKafkaList(page);

  await page.waitForSelector('[role=progressbar]', { state: 'detached', timeout: config.kafkaInstanceCreationTimeout });

  for (const el of await page.locator(`tr >> a`).elementHandles()) {
    const name = await el.textContent();
    await deleteKafkaInstance(page, name);
  }
});

// test_4kafka.py test_kafka_topic_create
test('create and delete a Kafka Topic', async ({ page }) => {
  await createKafkaInstance(page, testInstanceName);
  await navigateToKafkaTopicsList(page, testInstanceName);
  await createKafkaTopic(page, testTopicName);
  await deleteKafkaTopic(page, testTopicName);
  await deleteKafkaInstance(page, testInstanceName);
});
