import { expect, Page } from '@playwright/test';
import { closePopUp } from '@lib/popup';

// Navigates to Application and Data Services overview page when category of tested product is not present in navigation
export const navigateToApplicationAndDataServices = async function (page: Page, product: string) {
  // If category of tested product is not present in navigation
  if (!(await page.locator('button:text-is("' + product + '")').isVisible())) {
    // Open link to Application and Data Services overview page
    await page.getByRole('link', { name: 'Application and Data Services' }).click();
  }
};

// Opens category of tested product in navigation when link to list of tested product instances is not present there
export const navigateToProduct = async function (page: Page, product: string, productList: string) {
  // Navigate to prerequisite page first
  await navigateToApplicationAndDataServices(page, product);
  // If link to list of tested product instances is not present in navigation
  if (!(await page.locator('[data-testid=router-link]', { hasText: productList }).isVisible())) {
    // Open category of tested product in navigation
    await page.locator('button', { hasText: product }).click();
  }
};

// Navigates to list of tested product instances
export const navigateToProductList = async function (page: Page, product: string, productList: string) {
  // Navigate to prerequisite page first
  await navigateToProduct(page, product, productList);
  // Close pop-up notifications if present
  await closePopUp(page);
  // Open link to list of tested product instances
  await page.locator('[data-testid=router-link]', { hasText: productList }).click();
  // Check that page with list of tested product instances is opened
  await expect(page.locator('h1', { hasText: productList })).toHaveCount(1);
};

// Navigates to list of Streams for Apache Kafka instances
export const navigateToKafkaList = async function (page: Page) {
  await navigateToProductList(page, 'Streams for Apache Kafka', 'Kafka Instances');
  await expect(page.getByRole('button', { name: 'Create Kafka instance' })).toBeVisible();
};

// Navigates to list of Service Registry instances
export const navigateToServiceRegistryList = async function (page: Page) {
  await navigateToProductList(page, 'Service Registry', 'Service Registry Instances');
};
