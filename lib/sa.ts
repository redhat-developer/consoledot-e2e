import { expect, Page } from '@playwright/test';
import { config } from './config';
import { closePopUp } from './popup';
import { showElementActions } from './kafka';
import { resourceStore } from './resource_store';

export const navigateToSAList = async function (page: Page) {
  try {
    await expect(page.getByRole('link', { name: 'Application and Data Services' })).toHaveCount(1);
    await page.getByRole('link', { name: 'Application and Data Services' }).click();
  } catch (e) {
    // ignore
  }
  await closePopUp(page);

  await expect(page.locator('li >> a:text("Service Accounts")')).toHaveCount(1);
  await page.locator('li >> a:text("Service Accounts")').click();
  await expect(page.locator('h1', { hasText: 'Service Accounts' })).toHaveCount(1);
};

export const createServiceAccount = async function (page: Page, name: string) {
  await page.locator('button', { hasText: 'Create service account' }).click();

  await expect(page.getByText('Create a service account', { exact: true })).toHaveCount(1);

  await page.waitForSelector('[role=progressbar]', { state: 'detached' });

  await page.getByLabel('Short description *').fill(name);

  await page.locator('button:text-is("Create")').click();

  await expect(page.getByText('Credentials successfully generated')).toHaveCount(1);

  const clientID = await page.locator('[aria-label="Client ID"]').inputValue();
  const clientSecret = await page.locator('[aria-label="Client secret"]').inputValue();

  await page.getByLabel('I have copied the client ID and secret').check();

  // data-testid=modalCredentials-buttonClose
  await expect(page.locator('button', { hasText: 'Close' })).toBeEnabled();

  // data-testid=modalCredentials-buttonClose
  await page.locator('button', { hasText: 'Close' }).click();

  // check for the service account to have been created
  const table = await page.locator('[aria-label="Service account list"]');
  await expect(table.getByText(name)).toHaveCount(1);

  resourceStore.addServiceAccount(name);

  return { clientID: clientID, clientSecret: clientSecret };
};

export const deleteServiceAccount = async function (page: Page, name: string) {
  const saLinkSelector = page.locator('td', { hasText: name });

  const row = page.locator('tr', { has: saLinkSelector.nth(0) });

  await row.locator('[aria-label="Actions"]').nth(0).click();

  await expect(page.getByText('Delete service account')).toBeEnabled();
  await page.locator('button', { hasText: 'Delete service account' }).click();
  await page.locator('button', { hasText: 'Delete' }).click();

  await expect(page.locator('td', { hasText: name })).toHaveCount(
    0 /* , {
    timeout: config.serviceAccountDeletionTimeout
  } */
  );

  resourceStore.removeServiceAccount(name);
};

export const resetServiceAccount = async function (page: Page, name: string) {
  await showElementActions(page, name);

  await page.locator('button', { hasText: 'Reset credentials' }).click();

  await page.locator('button', { hasText: 'Reset' }).click();

  await expect(page.getByText('Credentials successfully generated')).toHaveCount(1);

  const clientID = await page.locator('[aria-label="Client ID"]').inputValue();
  const clientSecret = await page.locator('[aria-label="Client secret"]').inputValue();

  await page.getByLabel('I have copied the client ID and secret').check();

  // data-testid=modalCredentials-buttonClose
  await expect(page.locator('button', { hasText: 'Close' })).toBeEnabled();

  // data-testid=modalCredentials-buttonClose
  await page.locator('button', { hasText: 'Close' }).click();

  return { clientID: clientID, clientSecret: clientSecret };
};

export const deleteAllServiceAccounts = async function (page: Page) {
  const saList = resourceStore.getSeviceAccountList;
  await navigateToSAList(page);
  for (const saName of saList) {
    try {
      await deleteServiceAccount(page, saName);
    } catch (error) {
      //Ignore exception
    }
  }
  resourceStore.clearServiceAccountList();
};
