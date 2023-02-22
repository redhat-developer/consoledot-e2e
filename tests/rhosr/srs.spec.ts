import { test, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { config } from '@lib/config';
import { ServiceRegistryPage } from '@lib/pom/serviceRegistry/serviceRegistry';

// Define name of Service Registry instance for this set of tests
const testInstanceName = config.instanceName;

// Actions run before every test
test.beforeEach(async ({ page }) => {
  // Login to console
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  const serviceRegistryPage = new ServiceRegistryPage(page);
  await consoleDotAuthPage.login();
  // Go to list of Service Registry instances
  await serviceRegistryPage.gotoThroughMenu();
  // Wait for dismiss of loading spinner
  await page.waitForSelector('[role=progressbar]', {
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

// Checks that list of Service Registry instances is empty
test('check there are no Service Registry instances', async ({ page }) => {
  // Check presence of text informing about empty list
  await expect(page.getByText('No Service Registry instances yet')).toHaveCount(1);
});

// Create and delete Service Registry instance without waiting for its readiness
test('create and delete a Service Registry instance', async ({ page }) => {
  // Create instance
  const serviceRegistryPage = new ServiceRegistryPage(page);
  await serviceRegistryPage.createServiceRegistryInstance(testInstanceName);
  // Delete instance without waiting for its readiness
  await serviceRegistryPage.deleteServiceRegistryInstance(testInstanceName);
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
