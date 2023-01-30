import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import {
  navigateToKafkaList,
  navigateToConsumerGroups,
  deleteKafkaInstance,
  createKafkaInstance,
  waitForKafkaReady,
  navigateToAccess
} from '@lib/kafka';

const testInstanceName = 'test-instance-default';

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
      await waitForKafkaReady(page, testInstanceName);
    }
  }
});

test.afterAll(async ({ page }) => {
  await navigateToKafkaList(page);

  try {
    await deleteKafkaInstance(page, testInstanceName);
  } catch (error) {
    //Ignore exception
  }
});

// test_4kafka.py test_kafka_consumer_groups_empty
test('test kafka consumer groups empty', async ({ page }) => {
  await page.locator('a', { hasText: `${testInstanceName}` }).click();
  await navigateToConsumerGroups(page);
  await expect(page.locator('h2', { hasText: 'No consumer groups' })).toHaveCount(1);
});

// CHEQUEADO
// test_4kafka.py test_kafka_access_default
test('test kafka access default', async ({ page }) => {
  await page.locator('a', { hasText: `${testInstanceName}` }).click();
  await navigateToAccess(page, testInstanceName);
  await expect(page.locator('th', { hasText: 'Account' })).toHaveCount(1);
  await expect(page.locator('th', { hasText: 'Permission' })).toHaveCount(1);
  await expect(page.locator('th', { hasText: 'Resource' })).toHaveCount(1);
});
