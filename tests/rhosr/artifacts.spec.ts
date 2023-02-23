import { test, expect } from '@playwright/test';
import login from '@lib/auth';
import { config } from '@lib/config';
import {
  deleteServiceRegistryInstance,
  createServiceRegistryInstance,
  waitForServiceRegistryReady,
  deleteAllServiceRegistries
} from '@lib/service_registry';
import {
  navigateToServiceRegistryArtifactsList,
  deleteServiceRegistryArtifact,
  createServiceRegistryArtifact
} from '@lib/artifact';
import { navigateToServiceRegistryList } from '@lib/navigation';

// Define name of Service Registry instance for this set of tests
const testInstanceName = config.instanceName;
// Define artifact group name for artifacts of Service Registry instance for this set of tests
const testArtifactGroupName = `test-artifact-group-${config.sessionID}`;
// Define artifact ID prefix for artifacts of Service Registry instance for this set of tests
const testArtifactIDPrefix = `test-artifact-id-${config.sessionID}`;

// Actions run before every test
test.beforeEach(async ({ page }) => {
  // Login to console
  await login(page);
  // Go to list of Service Registry instances
  await navigateToServiceRegistryList(page);
  // Wait for dismiss of loading spinner
  await page.waitForSelector('[role=progressbar]', {
    state: 'detached',
    timeout: config.serviceRegistryInstanceCreationTimeout
  });
  // Wait for presence of button for Service Registry instance creation
  await page.waitForSelector('button:has-text("Create Service Registry instance")');
  // Check if test instance already exists and it is only present instance in list
  if ((await page.getByText(testInstanceName).count()) > 0 && (await page.locator('tr').count()) === 2) {
    // Only test instance is present, nothing to do!
  } else {
    // Go through list of instances
    for (const el of await page.locator(`tr >> a`).elementHandles()) {
      // Get instance name
      const name = await el.textContent();
      // If current instance is not instance for this set of tests
      if (name !== testInstanceName) {
        // Delete instance
        await deleteServiceRegistryInstance(page, name);
      }
    }
    // If test instance does not exist yet
    if ((await page.getByText(testInstanceName).count()) === 0) {
      // Create test instance
      await createServiceRegistryInstance(page, testInstanceName);
      // Wait for instance readiness
      await waitForServiceRegistryReady(page, testInstanceName);
    }
  }
});

// Actions run after each test
test.afterEach(async ({ page }) => {
  // Go to list of Service Registry instances
  await navigateToServiceRegistryList(page);
  // Go to artifacts list of Service Registry instance
  await navigateToServiceRegistryArtifactsList(page, testInstanceName);
  // Wait for dismiss of loading spinner
  await page.waitForSelector('[role=progressbar]', {
    state: 'detached'
  });
  // If there is at least one artifact present
  if (!(await page.getByText('No artifacts found').isVisible())) {
    // If there is at least one artifact in current test group
    if (!(await page.getByText(testArtifactGroupName).toHaveCount(0))) {
      // Click first occurrence of group to filter artifacts by this group
      await page.getByText(testArtifactGroupName).first().click();
      // Go through all artifacts in group
      for (const el of await page.getByTestId('artifacts-lnk-view-1').elementHandles()) {
        // Save id of artifact
        const id = await el.textContent();
        // If artifact id starts with current test prefix
        if (id.startsWith(testArtifactIDPrefix)) {
          // Delete artifact
          await deleteServiceRegistryArtifact(page, testArtifactGroupName, id);
        }
      }
    }
  }
});

// Actions run after all tests
test.afterAll(async ({ page }) => {
  // Delete all Service Registry instances created during tests
  await deleteAllServiceRegistries(page);
});

// Checks that artifacts list in Service Registry instance is empty
test('check there are no artifacts in Service Registry instance', async ({ page }) => {
  // Go to list of Service Registry instances
  await navigateToServiceRegistryList(page);
  // Go to artifacts list of Service Registry instance
  await navigateToServiceRegistryArtifactsList(page, testInstanceName);
  // Check presence of text informing about empty list
  await expect(page.getByText('No artifacts found')).toHaveCount(1);
});

// Tests upload and deletion of JSON Schema artifact
test('test upload and deletion of JSON Schema artifact', async ({ page }) => {
  // Prepare artifact id for test
  const testArtifactID = testArtifactIDPrefix + '-json';
  // Go to list of Service Registry instances
  await navigateToServiceRegistryList(page);
  // Go to artifacts list of Service Registry instance
  await navigateToServiceRegistryArtifactsList(page, testInstanceName);
  // Create artifact defined by group, id, type and content
  await createServiceRegistryArtifact(page, testArtifactGroupName, testArtifactID, 'JSON Schema', '{}');
  // Go to list of Service Registry instances
  await navigateToServiceRegistryList(page);
  // Go to artifacts list of Service Registry instance
  await navigateToServiceRegistryArtifactsList(page, testInstanceName);
  // Delete artifact defined by group and id
  await deleteServiceRegistryArtifact(page, testArtifactGroupName, testArtifactID);
});
