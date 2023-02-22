import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { BillingOptions } from '@lib/enums/billing';
import { config } from '@lib/config';
import { createKafkaInstance, deleteKafkaInstance, showKafkaDetails } from '@lib/pom/streams/kafkaInstances';
import test, { Page, expect } from '@playwright/test';
import { navigateToKafkaList } from '@lib/pom/navigation';

const testInstanceName = 'mk-ui-playwright-tests';
let currentUsername = config.stratosphere1username;

test.describe('Billing test cases', () => {
  test.skip(
    config.stratosphere1username == undefined ||
      config.stratosphere2username == undefined ||
      config.stratosphere3username == undefined ||
      config.stratosphere4username == undefined ||
      config.stratospherePassword == undefined,
    'Stratosphere users has to be defined for these tests'
  );

  test.afterEach(async ({ page }) => {
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
    await showKafkaDetails(page, testInstanceName);
    await expect(await page.locator('dd:has-text("' + billingOption + '")')).toHaveCount(1);
  }

  // Tests that user with all different billing options can create Kafka succesfully
  const users = [config.stratosphere1username, config.stratosphere2username, config.stratosphere4username];
  // This is needed to avoid same names of the tests which results into playwright execution failure
  let index = 0;
  for (const user of users) {
    test(`Billing check of user - ${index}#${user}`, async ({ page }) => {
      const consoleDotAuthPage = new ConsoleDotAuthPage(page);
      currentUsername = user;

      await consoleDotAuthPage.login(user, config.stratospherePassword);

      await setupKafkaFreshInstance(page, BillingOptions.PREPAID);
      await showKafkaDetails(page, testInstanceName);
    });
    index++;
  }

  // Tests that different billing options are properly set in instance details
  const billingOptions = [BillingOptions.AWS_MARKETPLACE, BillingOptions.RH_MARKETPLACE, BillingOptions.PREPAID];
  for (const billingOption of billingOptions) {
    test(`Billing option for ${config.stratosphere3username} - ${billingOption}`, async ({ page }) => {
      const consoleDotAuthPage = new ConsoleDotAuthPage(page);
      currentUsername = config.stratosphere3username;
      await consoleDotAuthPage.login(currentUsername, config.stratospherePassword);
      await performBillingTest(page, billingOption);
    });
  }
});
