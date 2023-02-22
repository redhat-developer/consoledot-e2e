import { closePopUp } from "@lib/utils/popup";
import { Locator, Page, expect } from "@playwright/test";

export abstract class AbstractPage {
    readonly page: Page;
    readonly nameForm: Locator;
    readonly details: Locator;
    readonly deleteNameInput: Locator;
    readonly deleteButton: Locator;
    readonly nextButton: Locator;
    readonly finishButton: Locator;
    readonly appDataServicesLink: Locator;
    readonly menuLocator: string = '[data-testid=router-link]';
    readonly actionsLocatorString: string = '[aria-label="Actions"]';
    readonly progressBarLocatorString: string = '[role=progressbar]';
    readonly confirmDeleteField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameForm = page.getByLabel('Name *');
    this.details = page.locator('button', { hasText: 'Details' });
    this.deleteNameInput = page.locator('input[name="mas-name-input"]');
    this.deleteButton = page.locator('button', { hasText: 'Delete' });
    this.appDataServicesLink = page.getByRole('link', { name: 'Application and Data Services' });
    this.nextButton = page.locator('button', { hasText: 'Next' });
    this.finishButton = page.locator('button', { hasText: 'Finish' });
    this.confirmDeleteField = page.getByLabel('Type DELETE to confirm:');
  }

  async showElementActions(selectorName: string) {
    const selectorLink = this.page.getByText(selectorName);
    const row = this.page.locator('tr', { has: selectorLink });

    await row.locator(this.actionsLocatorString).click();
  };

  // Navigates to Application and Data Services overview page when category of tested product is not present in navigation
  async navigateToApplicationAndDataServices(product: string) {
    // If category of tested product is not present in navigation
    if (!(await this.page.locator('button:text-is("' + product + '")').isVisible())) {
      // Open link to Application and Data Services overview page
      await this.appDataServicesLink.click();
    }
  }

  // Opens category of tested product in navigation when link to list of tested product instances is not present there
  async navigateToProduct(product: string, productList: string) {
    // Navigate to prerequisite page first
    await this.navigateToApplicationAndDataServices(product);
    // If link to list of tested product instances is not present in navigation
    if (!(await this.page.locator(this.menuLocator, { hasText: productList }).isVisible())) {
      // Open category of tested product in navigation
      await this.page.locator('button', { hasText: product }).click();
    }
  }

  // Navigates to list of tested product instances
  async navigateToProductList(product: string, productList: string) {
    // Navigate to prerequisite page first
    await this.navigateToProduct(product, productList);
    // Close pop-up notifications if present
    await closePopUp(this.page);
    // Open link to list of tested product instances
    await this.page.locator(this.menuLocator, { hasText: productList }).click();
    // Check that page with list of tested product instances is opened
    await expect(this.page.locator('h1', { hasText: productList })).toHaveCount(1);
  }
}