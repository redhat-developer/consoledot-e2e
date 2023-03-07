import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { BillingOptions } from '@lib/enums/billing';
import { config } from '@lib/config';
import { KafkaInstanceListPage } from '@lib/pom/streams/kafkaInstanceList';
import { Page, expect } from '@playwright/test';
import { test } from '@lib/utils/fixtures';

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
    const kafkaInstancesPage = new KafkaInstanceListPage(page);
    await kafkaInstancesPage.gotoThroughMenu();
    await kafkaInstancesPage.deleteKafkaInstance(testInstanceName);
  });

  async function setupKafkaFreshInstance(page: Page, billingOption: BillingOptions) {
    const kafkaInstancesPage = new KafkaInstanceListPage(page);
    await kafkaInstancesPage.gotoThroughMenu();

    if ((await page.getByText(testInstanceName).count()) == 1) {
      await kafkaInstancesPage.deleteKafkaInstance(testInstanceName);
    }
    await kafkaInstancesPage.createKafkaInstance(testInstanceName, false, billingOption);
  }

  async function performBillingTest(page: Page, billingOption: BillingOptions) {
    const kafkaInstancesPage = new KafkaInstanceListPage(page);
    await setupKafkaFreshInstance(page, billingOption);
    await kafkaInstancesPage.showKafkaDetails(testInstanceName);
    await expect(await page.locator('dd:has-text("' + billingOption + '")')).toHaveCount(1);
  }

  // Tests that user with all different billing options can create Kafka succesfully
  const users = [config.stratosphere1username, config.stratosphere2username, config.stratosphere4username];
  // This is needed to avoid same names of the tests which results into playwright execution failure
  let index = 0;
  for (const user of users) {
    test(`Billing check of user - ${index}#${user}`, async ({ page }) => {
      const consoleDotAuthPage = new ConsoleDotAuthPage(page);
      const kafkaInstancesPage = new KafkaInstanceListPage(page);
      currentUsername = user;

      await consoleDotAuthPage.login(user, config.stratospherePassword);

      await setupKafkaFreshInstance(page, BillingOptions.PREPAID);
      await kafkaInstancesPage.showKafkaDetails(testInstanceName);
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
