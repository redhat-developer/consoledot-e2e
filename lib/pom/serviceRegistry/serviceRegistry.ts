import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { resourceStore } from '@lib/resource_store';
import { AbstractPage } from '@lib/pom/abstractPage';

export class ServiceRegistryPage extends AbstractPage {
  readonly urlPath: string = '/application-services/service-registry';
  readonly productName: string = 'Service Registry';
  readonly productList: string = 'Service Registry Instances';
  readonly createServiceRegistryInstanceButton: Locator;
  readonly createServiceRegistryInstanceHeading: Locator;
  readonly nameInputForm: Locator;
  readonly submitButton: Locator;
  readonly serviceRegistryTable: Locator;
  readonly deleteCheckbox: Locator;
  readonly deleteNameInput: Locator;

  constructor(page: Page) {
    super(page);
    this.createServiceRegistryInstanceButton = page.locator('button', { hasText: 'Create Service Registry instance' });
    this.createServiceRegistryInstanceHeading = page.getByText('Create a Service Registry instance');
    this.nameInputForm = page.getByLabel('Name *');
    this.submitButton = page.locator('button[type="submit"]');
    this.serviceRegistryTable = page.locator('[aria-label="Service Registry instance list"]');
    this.deleteCheckbox = page.locator('input[type="checkbox"]');
    this.deleteNameInput = page.locator('input[name="mas-name-input"]');
  }

  // Got to starting page
  async gotoUrl() {
    await this.page.goto(config.startingPage + this.urlPath);
    // Button for creating SR is visible
    await expect(this.createServiceRegistryInstanceButton).toHaveCount(1);
  }

  async gotoThroughMenu() {
    // Navigates to list of Service Registry instances
    await this.navigateToProductList(this.productName, this.productList);
  }

  // Creates Service Registry instance defined by name,
  // checks creation of Service Registry instance when required
  async createServiceRegistryInstance(name: string, check = true) {
    // Open modal box for creation of instance by click on button
    await this.createServiceRegistryInstanceButton.click();
    // Check that modal box for creation is opened
    await expect(this.createServiceRegistryInstanceHeading).toHaveCount(1);
    // Add instance name into resource store
    resourceStore.addServiceRegistry(name);
    // Click into name input
    await this.nameInputForm.click();
    // Fill name of instance
    await this.nameInputForm.fill(name);
    // Click on create button
    await this.submitButton.click();

    // If creation check is required
    if (check) {
      // Get table with instances
      const table = await this.serviceRegistryTable;
      // Check that instance name is present in table
      expect(table.getByText(name)).toBeTruthy();
    }
  }

  // Deletes Service Registry instance defined by name,
  // waits for deletion of Service Registry instance when required
  async deleteServiceRegistryInstance(name: string, awaitDeletion = true) {
    // Open three-dots menu of instance
    await this.showElementActions(name);
    // Click on delete button in actions menu
    await this.actionsDeleteButton.click();
    // Check if confirmation input is visible
    if (this.deleteNameInput.isVisible) {
      // Wait for presence of name input
      await expect(this.deleteNameInput).toHaveCount(1, { timeout: 5000 });
      // Click into name input
      await this.deleteNameInput.click();
      // Fill name of instance
      await this.deleteNameInput.fill(name);
      // Tick checkbox for deletion
      await this.deleteCheckbox.click();
    }
    // Click on delete button
    await this.actionsDeleteButton.click();
    // If deletion wait is required
    if (awaitDeletion) {
      // Wait for absence of instance name for defined timeout
      await expect(this.page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
        timeout: config.serviceRegistryInstanceDeletionTimeout
      });
    }
    // Remove instance name from resource store
    resourceStore.removeServiceRegistry(name);
  }

  // Waits for readiness of Service Registry instance defined by name
  async waitForServiceRegistryReady(name: string) {
    // Get link of instance
    const instanceLinkSelector = this.page.getByText(name);
    // Get row of instance
    const row = this.page.locator('tr', { has: instanceLinkSelector });
    // Wait for readiness of instance for defined timeout
    await expect(row.getByText('Ready', { exact: true })).toHaveCount(1, {
      timeout: config.serviceRegistryInstanceCreationTimeout
    });
  }

  // Deletes all Service Registry instances still present in resource store
  async deleteAllServiceRegistries() {
    // Get list of instance names present in resource store
    const serviceRegistryList = resourceStore.getServiceRegistryList;
    // Go to Service Registry instances list page
    await this.gotoThroughMenu();
    // For every instance name in list
    for (const serviceRegistryName of serviceRegistryList) {
      try {
        // Delete instance defined by name
        await this.deleteServiceRegistryInstance(serviceRegistryName);
      } catch (error) {
        // Ignore exception, instance probably does not exist already
      }
    }
    // Clear list of instance names in resource store
    resourceStore.clearServiceRegistryList();
  }
}
