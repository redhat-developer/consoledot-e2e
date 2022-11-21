import { test } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import { navigateToKafkaList } from '@lib/kafka';

const testInstanceName = `test-instance-${config.sessionID}`;

test.beforeEach(async ({ page }) => {
  await login(page);
  await navigateToKafkaList(page);
});
