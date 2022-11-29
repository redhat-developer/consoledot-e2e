import { expect, Page } from "@playwright/test";
import { config } from "./config";

export const navigateToSAList = async function (page: Page) {
    await page.getByRole('link', { name: 'Application and Data Services' }).click();
    // }
    await page.getByRole('link', { name: 'Service Accounts' }).click();
    await expect(page.getByRole('heading', { name: 'Service Accounts' })).toHaveCount(1);
};

export const createServiceAccount = async function (page: Page, name: string) {
    await page.getByTestId('emptyStateStreams-buttonCreateServiceAccount').click();

    await expect(page.getByText('Create a service account', {exact: true})).toHaveCount(1);

    await page.waitForSelector('[role=progressbar]', { state: 'detached' });

    await page.getByLabel('Short description *').fill(name);

    await page.getByTestId('modalCreateServiceAccount-buttonSubmit').click();

    await expect(page.getByText('Credentials successfully generated')).toHaveCount(1);

    const clientID = await page.locator('[aria-label="Client ID"]').inputValue();
    const clientSecret = await page.locator('[aria-label="Client secret"]').inputValue();

    await page.getByLabel('I have copied the client ID and secret').check();

    await expect(page.getByTestId('modalCredentials-buttonClose')).toBeEnabled();

    await page.getByTestId('modalCredentials-buttonClose').click()

    // check for the service account to have been created
    const table = await page.locator('[aria-label="Service account list"]');
    await expect(table.getByText(name)).toHaveCount(1);

    return {clientID: clientID, clientSecret: clientSecret}
};

export const deleteServiceAccount = async function (page: Page, name: string) {
    console.log("Deleting service account " + name);
    const instanceLinkSelector = page.getByText(name, { exact: true });

    let count = await instanceLinkSelector.count();
    while (count > 0) {
        const row = page.locator('tr', { has: instanceLinkSelector.nth(0) });

        await row.locator('[aria-label="Actions"]').nth(0).click();

        await expect(page.getByText('Delete service account')).toBeEnabled();

        await page.getByText('Delete service account').click();

        await page.locator('#confirm__button').click();

        await expect(instanceLinkSelector).toHaveCount(count - 1);

        count--;
    }

    // await for all the accounts with the same name to be deleted
    await expect(page.getByText(`${name}`, { exact: true })).toHaveCount(0, {
        timeout: config.serviceAccountDeletionTimeout
    });
};

export const resetServiceAccount = async function (page: Page, name: string) {
    const instanceLinkSelector = page.getByText(name);
    const row = page.locator('tr', { has: instanceLinkSelector });

    await row.locator('[aria-label="Actions"]').click();

    await page.getByText('Reset credentials').click();

    await page.locator('button:has-text("Reset")').click();

    await expect(page.getByText('Credentials successfully generated')).toHaveCount(1);

    const clientID = await page.locator('[aria-label="Client ID"]').inputValue();
    const clientSecret = await page.locator('[aria-label="Client secret"]').inputValue();

    await page.getByLabel('I have copied the client ID and secret').check();

    await expect(page.getByTestId('modalCredentials-buttonClose')).toBeEnabled();

    await page.getByTestId('modalCredentials-buttonClose').click()

    return {clientID: clientID, clientSecret: clientSecret}
};
