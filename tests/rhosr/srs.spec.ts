import { test } from '@lib/utils/fixtures';
import { config } from '@lib/config';
import { ServiceRegistryPage } from '@lib/pom/serviceRegistry/serviceRegistry';
import { AbstractPage } from '@lib/pom/abstractPage';

// Define name of Service Registry instance for this set of tests
const testInstanceName = config.instanceName;

// Use admin user context
test.use({ storageState: config.adminAuthFile });

// Actions run before every test
test.beforeEach(async ({ page }) => {
  // Login to console
  const serviceRegistryPage = new ServiceRegistryPage(page);
  // Go to list of Service Registry instances
  await serviceRegistryPage.gotoThroughMenu();
  // Wait for dismiss of loading spinner
  await page.waitForSelector(AbstractPage.progressBarLocatorString, {
    state: 'detached',
    timeout: config.serviceRegistryInstanceCreationTimeout
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
});

// Actions run after all tests
test.afterAll(async ({ page }) => {
  // Delete all Service Registry instances created during tests
  const serviceRegistryPage = new ServiceRegistryPage(page);
  await serviceRegistryPage.deleteAllServiceRegistries();
});

// Create and delete Service Registry instance with waiting for its readiness
test('create, wait for ready and delete a Service Registry instance', async ({ page }) => {
  // Create instance
  const serviceRegistryPage = new ServiceRegistryPage(page);
  await serviceRegistryPage.createServiceRegistryInstance(testInstanceName);
  // Wait for instance readiness
  await serviceRegistryPage.waitForServiceRegistryReady(testInstanceName);
  // Delete instance
  await serviceRegistryPage.deleteServiceRegistryInstance(testInstanceName);
});
