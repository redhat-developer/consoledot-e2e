import { config } from '@lib/config';
import {test as base, expect, Page} from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import {ServiceRegistryPage} from "@lib/pom/serviceRegistry/serviceRegistry";
import {AbstractPage} from "@lib/pom/abstractPage";
import {ServiceAccountPage} from "@lib/pom/serviceAccounts/sa";


// Declare the types of your fixtures.
type PomFixtures = {
  page: Page;
  serviceRegistryPage: ServiceRegistryPage;
  serviceAccountPage: ServiceAccountPage;
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
    await serviceRegistryPage.waitForSelector(AbstractPage.progressBarLocatorString, {
      state: 'detached',
      timeout: config.serviceRegistryInstanceCreationTimeout,
    });
    // Wait for presence of button for Service Registry instance creation
    await serviceRegistryPage.waitForSelector('button:has-text("Create Service Registry instance")');
    // Delete all existing Service Registry instances
    for (const el of await serviceRegistryPage.locator(`tr >> a`).elementHandles()) {
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

  serviceAccountPage: async ({ page }, use) => {
    const serviceAccountPage = new ServiceAccountPage(page);
    // Go to list of Service accounts instances
    await serviceAccountPage.gotoThroughMenu();

    // Use fixture in test
    await use(serviceAccountPage);

    // Teardown - Delete all Service accounts created during tests
    await serviceAccountPage.deleteAllServiceAccounts();
  },


});

