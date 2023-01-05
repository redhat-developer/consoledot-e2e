import login from '@lib/auth';
import { BillingOptions } from '@lib/billing';
import { config } from '@lib/config';
import { createKafkaInstance, deleteKafkaInstance, navigateToKafkaList, showKafkaDetails } from '@lib/kafka';
import test, { Page, expect } from '@playwright/test';

const testInstanceName = 'mk-ui-playwright-tests';
let currentUsername = config.stratosphere1username;

test.describe('Stratosphere users has to be defined for these tests', () => {
  if (
    config.stratosphere1username == undefined ||
    config.stratosphere2username == undefined ||
    config.stratosphere3username == undefined ||
    config.stratosphere4username == undefined
  ) {
    console.log('test se skipne');
    test.skip();
  }

  test.afterEach(async ({ page }) => {
    try {
      await login(page, currentUsername, config.stratospherePassword);
    } catch (err) {
      // Already logged in, do nothing
    }
    await navigateToKafkaList(page);
    await deleteKafkaInstance(page, testInstanceName);
  });

  async function setupKafkaFreshInstance(page: Page, billingOption: BillingOptions) {
    await navigateToKafkaList(page);
    await expect(page.getByRole('button', { name: 'Create Kafka instance' })).toBeVisible();
    if ((await page.getByText(testInstanceName).count()) == 1) {
      await deleteKafkaInstance(page, testInstanceName);
    }
    await createKafkaInstance(page, testInstanceName, false, billingOption);
  }

  async function performBillingTest(page: Page, billingOption: BillingOptions) {
    await setupKafkaFreshInstance(page, billingOption);
    await showKafkaDetails(page);
    await expect(await page.locator('dd:has-text("' + billingOption + '")')).toHaveCount(1);
  }

  // Tests that user with all different billing options can create Kafka succesfully
  const users = [config.stratosphere1username, config.stratosphere2username, config.stratosphere4username];
  for (const user of users) {
    test(`Billing check of user: ${user}`, async ({ page }) => {
      currentUsername = user;
      await login(page, user, config.stratospherePassword);

      await setupKafkaFreshInstance(page, BillingOptions.PREPAID);
      await showKafkaDetails(page);
    });
  }

  // Tests that different billing options are properly set in instance details
  const billingOptions = [BillingOptions.AWS_MARKETPLACE, BillingOptions.RH_MARKETPLACE, BillingOptions.PREPAID];
  for (const billingOption of billingOptions) {
    test(`Billing option for ${config.stratosphere3username}: ${billingOption}`, async ({ page }) => {
      currentUsername = config.stratosphere3username;
      await login(page, currentUsername, config.stratospherePassword);

      switch (billingOption) {
        case BillingOptions.PREPAID:
          await performBillingTest(page, billingOption);
          break;
        case BillingOptions.AWS_MARKETPLACE:
          await performBillingTest(page, billingOption);
          break;
        case BillingOptions.RH_MARKETPLACE:
          await performBillingTest(page, billingOption);
          break;
      }
    });
  }
});
