import { expect, Page } from '@playwright/test';
import { config } from './config';
import { navigateToServiceRegistryList } from './navigation';
import { resourceStore } from './resource_store';

// Opens three-dots menu of Service Registry instance defined by name
export const showElementActions = async function (page: Page, instanceName: string) {
  // Get link of instance
  const instanceLinkSelector = page.getByText(instanceName);
  // Get row of instance
  const row = page.locator('tr', { has: instanceLinkSelector });
  // Click on three-dots menu of instance
  await row.locator('[aria-label="Actions"]').click();
};

// Creates Service Registry instance defined by name,
// checks creation of Service Registry instance when required
export const createServiceRegistryInstance = async function (page: Page, name: string, check = true) {
  // Open modal box for creation of instance by click on button
  await page.locator('button', { hasText: 'Create Service Registry instance' }).click();
  // Check that modal box for creation is opened
  await expect(page.getByText('Create a Service Registry instance')).toHaveCount(1);
  // Add instance name into resource store
  resourceStore.addServiceRegistry(name);
  // Click into name input
  await page.getByLabel('Name *').click();
  // Fill name of instance
  await page.getByLabel('Name *').fill(name);
  // Click on create button
  await page.locator('button[type="submit"]').click();

  // If creation check is required
  if (check) {
    // Get table with instances
    const table = await page.locator('[aria-label="Service Registry instance list"]');
    // Check that instance name is present in table
    await expect(table.getByText(name)).toBeTruthy();
  }
};

// Deletes Service Registry instance defined by name,
// waits for deletion of Service Registry instance when required
export const deleteServiceRegistryInstance = async function (page: Page, name: string, awaitDeletion = true) {
  try {
    // Open three-dots menu of instance
    await showElementActions(page, name);
    // Click on delete button
    await page.locator('button', { hasText: 'Delete' }).click();

    try {
      // Wait for presence of name input
      await expect(page.locator('input[name="mas-name-input"]')).toHaveCount(1, { timeout: 5000 });
      // Click into name input
      await page.locator('input[name="mas-name-input"]').click();
      // Fill name of instance
      await page.locator('input[name="mas-name-input"]').fill(name);
      // Tick checkbox for deletion
      await page.locator('input[type="checkbox"]').click();
    } catch (err) {
      // Deletion without confirmation - ignore
    }

    // Click on delete button
    await page.locator('button', { hasText: 'Delete' }).click();
    // If deletion wait is required
    if (awaitDeletion) {
      // Wait for absence of instance name for defined timeout
      await expect(page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
        timeout: config.serviceRegistryInstanceDeletionTimeout
      });
    }
    // Remove instance name from resource store
    resourceStore.removeServiceRegistry(name);
  } catch (err) {
    // Do nothing as instance is not connected to this account
  }
};

// Waits for readiness of Service Registry instance defined by name
export const waitForServiceRegistryReady = async function (page: Page, name: string) {
  // Get link of instance
  const instanceLinkSelector = page.getByText(name);
  // Get row of instance
  const row = page.locator('tr', { has: instanceLinkSelector });
  // Wait for readiness of instance for defined timeout
  await expect(row.getByText('Ready', { exact: true })).toHaveCount(1, {
    timeout: config.serviceRegistryInstanceCreationTimeout
  });
};

// Deletes all Service Registry instances still present in resource store
export const deleteAllServiceRegistries = async function (page: Page) {
  // Get list of instance names present in resource store
  const serviceRegistryList = resourceStore.getServiceRegistryList;
  // Go to Service Registry instances list page
  await navigateToServiceRegistryList(page);
  // For every instance name in list
  for (const serviceRegistryName of serviceRegistryList) {
    try {
      // Delete instance defined by name
      await deleteServiceRegistryInstance(page, serviceRegistryName);
    } catch (error) {
      // Ignore exception, instance probably does not exist already
    }
  }
  // Clear list of instance names in resource store
  resourceStore.clearServiceRegistryList();
};
