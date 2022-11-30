import { expect, Page } from '@playwright/test';
import { config } from './config';
import { closePopUp } from './popup';

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

/* export const navigateToServiceAccounts = async function (page: Page) {
  await page.getByText('Service Accounts').click();
  await expect(page.locator('h1:has-text("Service Accounts")')).toHaveCount(1);
}; */

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

  return { clientID: clientID, clientSecret: clientSecret };
};

/* export const createServiceAccount = async function (page: Page, desc: string) {
  await page.getByTestId('emptyStateStreams-buttonCreateServiceAccount').click();
  await page.getByLabel('Short description *').fill(desc);
  await page.getByTestId('modalCreateServiceAccount-buttonSubmit').click();

  class saCredentials {
    id: string;
    secret: string;
  }
  const credentials = new saCredentials();

  credentials.id = await page.locator('[aria-label="Client ID"]').getAttribute('value');
  console.log('credentials.id=' + credentials.id);
  credentials.secret = await page.locator('[aria-label="Client secret"]').getAttribute('value');
  console.log('credentials.secret=' + credentials.secret);
  await page.getByLabel('I have copied the client ID and secret').check();
  await page.getByTestId('modalCredentials-buttonClose').click();

  await expect(page.getByText(desc)).toHaveCount(1);
  return credentials;
}; */

export const deleteServiceAccount = async function (page: Page, name: string) {
  const instanceLinkSelector = page.getByText(name, { exact: true });

  let count = await instanceLinkSelector.count();
  while (count > 0) {
    const row = page.locator('tr', { has: instanceLinkSelector.nth(0) });

    await row.locator('[aria-label="Actions"]').nth(0).click();

    await expect(page.getByText('Delete service account')).toBeEnabled();
    await page.locator('button', { hasText: 'Delete service account' }).click();

    // #confirm__button
    await page.locator('button', { hasText: 'Delete' }).click();

    await expect(instanceLinkSelector).toHaveCount(count - 1);

    count--;
  }

  // await for all the accounts with the same name to be deleted
  await expect(page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
    timeout: config.serviceAccountDeletionTimeout
  });
};

/* export const deleteServiceAccount = async function (page: Page, desc: string) {
  const instanceLinkSelector = page.getByText(desc);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();
  await page.getByTestId('tableServiceAccounts-actionDeleteAccount').click();
  await page.locator('button:has-text("Delete")').click();
}; */

export const resetServiceAccount = async function (page: Page, name: string) {
  const instanceLinkSelector = page.getByText(name);
  const row = page.locator('tr', { has: instanceLinkSelector });

  await row.locator('[aria-label="Actions"]').click();

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
