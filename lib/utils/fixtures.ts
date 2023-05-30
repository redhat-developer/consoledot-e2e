import { config } from '@lib/config';
import {test as base, expect, Page} from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import {ServiceRegistryPage} from "@lib/pom/serviceRegistry/serviceRegistry";
import {AbstractPage} from "@lib/pom/abstractPage";
import {ServiceAccountPage} from "@lib/pom/serviceAccounts/sa";
import {KafkaInstanceListPage} from "@lib/pom/streams/kafkaInstanceList";
import {KafkaInstancePage} from "@lib/pom/streams/kafkaInstance";
import {AccessPage} from "@lib/pom/streams/instance/access";
import {ConsumerGroupsPage} from "@lib/pom/streams/instance/consumerGroups";
import {TopicListPage} from "@lib/pom/streams/instance/topicList";

const testInstanceName = config.instanceName;

// Declare the types of your fixtures.
type PomFixtures = {
  page: Page;
  serviceRegistryPage: ServiceRegistryPage;
  serviceAccountPage: ServiceAccountPage;
  kafkaInstancePage: KafkaInstancePage;
  kafkaInstanceListPage: KafkaInstanceListPage;
  kafkaAccessPage: AccessPage;
  consoleDotAuthPage: ConsoleDotAuthPage;
  consumerGroupsPage: ConsumerGroupsPage;
  kafkaTopicPage: TopicListPage;
};

// Extend Playwright page to start always at config.startingPage
export const test = base.extend<PomFixtures>({
  page: async ({ page }, use, testInfo) => {
    const autPage = new ConsoleDotAuthPage(page);

    const errLogs = [];

    // Disable analytics, segment, pendo and other disruptive popups
    await page.addInitScript(() => {
      window.localStorage.setItem('chrome:analytics:disable', String(true));
      window.localStorage.setItem('chrome:segment:disable', String(true));
    });

    if (config.enableErrLogging) {
      page.on('console', (msg) => {
        if (msg.type() === 'error') errLogs.push(`Error: "${msg.text()}"`);
      });

      page.on('pageerror', (err) => {
        errLogs.push(`PageError: ${err.message}`);
      });

      page.on('requestfailed', (request) => {
        errLogs.push(`Request failed: ${request.url()} ${request.failure().errorText}`);
      });
    }
    await page.goto(config.startingPage);
    // check we landed on the right page`
    try {
      await autPage.checkUiIsVisible();
    } catch {
      await autPage.checkLoginPageVisible();
    }
    await expect(page.getByText('Gain increased visibility into your hybrid cloud')).toBeTruthy();
    await autPage.closeCookieBanner();

    // use beta environment
    if (config.useBeta) {
      await autPage.switchBetaOn();
    }

    await use(page);

    if (testInfo.status == 'failed' || testInfo.status == 'timedOut') {
      for (const logEntry of errLogs) {
        console.error(logEntry);
      }
    }
  },

  // Fixture to create a new page and initialize the ServiceRegistryPage
  serviceRegistryPage: async ({ page }, use) => {
    const serviceRegistryPage = new ServiceRegistryPage(page);
    // Go to list of Service Registry instances
    await serviceRegistryPage.gotoThroughMenu();
    // Wait for dismiss of loading spinner
    await page.waitForSelector(AbstractPage.progressBarLocatorString, {
      state: 'detached',
      timeout: config.serviceRegistryInstanceCreationTimeout,
    });
    // Wait for presence of button for Service Registry instance creation
    await page.waitForSelector('button:has-text("Create Service Registry instance")');
    // Delete all existing Service Registry instances
    for (const el of await page.locator(`tr >> a`).elementHandles()) {
      // Get name of existing instance
      const name = await el.textContent();
      // Delete instance
      await serviceRegistryPage.deleteServiceRegistryInstance(name);
    }
    // Use fixture in test
    await use(serviceRegistryPage);
    // Teardown - Delete all Service Registry instances created during tests
    await serviceRegistryPage.deleteAllServiceRegistries();
  },

  // Fixture to create a new page and initialize the ServiceAccountPage
  serviceAccountPage: async ({ page }, use) => {
    const serviceAccountPage = new ServiceAccountPage(page);
    // Go to list of Service accounts instances
    await serviceAccountPage.gotoThroughMenu();

    // Use fixture in test
    await use(serviceAccountPage);

    // Teardown - Delete all Service accounts created during tests
    await serviceAccountPage.deleteAllServiceAccounts();
  },

  // Fixture to create a new page and initialize the kafkaInstanceListPage which returns list of Kafka instances
  kafkaInstanceListPage: async ({ page }, use) => {
    const kafkaInstancesListPage = new KafkaInstanceListPage(page);
    await kafkaInstancesListPage.gotoThroughMenu();

    await page.waitForSelector(AbstractPage.progressBarLocatorString, {
      state: 'detached',
      timeout: config.kafkaInstanceCreationTimeout
    });

    // Use fixture in test
    await use(kafkaInstancesListPage);

    // Teardown - Delete all Kafka instances
    await kafkaInstancesListPage.deleteAllKafkas();
  },

  // Fixture to create a new page and initialize the consoleDotAuthPage
  consoleDotAuthPage: async ({ page }, use) => {
    const consoleDotAuthPage = new ConsoleDotAuthPage(page);
    await consoleDotAuthPage.goto();

    // Use fixture in test
    await use(consoleDotAuthPage);
  },

  // Fixture to create a new page and initialize the kafkaInstancePage and create new kafka instance if not present
  kafkaInstancePage: async ({ kafkaInstanceListPage,page }, use) => {
    const kafkaInstancePage = new KafkaInstancePage(page, testInstanceName);
    await kafkaInstanceListPage.gotoThroughMenu();

    if ((await kafkaInstanceListPage.noKafkaInstancesText.count()) == 1) {
      await kafkaInstanceListPage.createKafkaInstance(testInstanceName);
      await kafkaInstanceListPage.waitForKafkaReady(testInstanceName);
    } else {
      // Test instance present, nothing to do!
      try {
        await expect(page.getByText(testInstanceName)).toHaveCount(1, { timeout: 2000 });
      } catch (e) {
        await kafkaInstanceListPage.createKafkaInstance(testInstanceName);
        await kafkaInstanceListPage.waitForKafkaReady(testInstanceName);
      }
    }

    // Use fixture in test
    await use(kafkaInstancePage);

    // Teardown - Delete all kafka instances created during tests
    await kafkaInstanceListPage.gotoThroughMenu();

    try {
      await kafkaInstanceListPage.deleteKafkaInstance(testInstanceName);
    } catch (error) {
      //Ignore exception
    }
  },

  // Fixture to create a new page and initialize the AccessPage
  kafkaAccessPage: async ({ kafkaInstancePage, kafkaInstanceListPage  }, use) => {
    const kafkaAccessPage = new AccessPage(page, testInstanceName);
    await kafkaInstanceListPage.waitForKafkaReady(testInstanceName);
    await kafkaInstancePage;
    await kafkaAccessPage.gotoThroughMenu();

    // Use fixture in test
    await use(kafkaAccessPage);
  },

  // Fixture to create a new page and initialize the Kafkas's Consumer group page
  consumerGroupsPage: async ({ kafkaInstancePage}, use) => {
    const consumerGroupsPage = new ConsumerGroupsPage(page, testInstanceName);
    await kafkaInstancePage;

    await consumerGroupsPage.gotoThroughMenu();

    // Use fixture in test
    await use(consumerGroupsPage);
  },

  // Fixture to create a new page and initialize the consoleDotAuthPage
  kafkaTopicPage: async ({ kafkaInstancePage }, use) => {
    const topicPage = new TopicListPage(page, testInstanceName);
    await kafkaInstancePage;
    await topicPage.gotoThroughMenu();

    // Use fixture in test
    await use(topicPage);
  },
});
