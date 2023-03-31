import { expect, Locator, Page } from '@playwright/test';
import { config } from '@lib/config';
import { closePopUp } from '@lib/utils/popup';
import { resourceStore } from '@lib/resource_store';
import { AbstractPage } from '@lib/pom/abstractPage';

export class ServiceAccountPage extends AbstractPage {
  readonly urlPath: string = '/application-services/service-accounts';
  readonly serviceAccountHeading: Locator;
  readonly serviceAccountMenuLink: Locator;
  readonly createServiceAccountButton: Locator;
  readonly serviceAccountDescription: Locator;
  readonly createButton: Locator;
  readonly clientId: Locator;
  readonly clientSecret: Locator;
  readonly serviceAccountTable: Locator;
  readonly deleteServiceAccountButton: Locator;
  readonly resetCredentialsButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    super(page);
    this.serviceAccountHeading = page.locator('h1', { hasText: 'Service Accounts' });
    this.serviceAccountMenuLink = page.locator('li >> a:text("Service Accounts")');
    this.createServiceAccountButton = page.locator('button', { hasText: 'Create service account' });
    this.serviceAccountDescription = page.getByLabel('Short description *');
    this.createButton = page.locator('button:text-is("Create")');
    this.clientId = page.locator('[aria-label="Client ID"]');
    this.clientSecret = page.locator('[aria-label="Client secret"]');
    this.serviceAccountTable = page.locator('[aria-label="Service account list"]');
    this.deleteServiceAccountButton = page.locator('button', { hasText: 'Delete service account' });
    this.resetCredentialsButton = page.locator('button', { hasText: 'Reset credentials' });
    this.resetButton = page.locator('button', { hasText: 'Reset' });
  }

  // Go to page with Service Accounts
  async gotoUrl() {
    await this.page.goto(config.startingPage + this.urlPath);
    // Expect a title "to contain" a Service Account string.
    await expect(this.createServiceAccountButton).toHaveCount(1);
  }

  // Go to page with Service Accounts through menu
  async gotoThroughMenu() {
    try {
      await expect(this.appDataServiceMenuLink).toHaveCount(1, { timeout: 2000 });
      await this.appDataServiceMenuLink.click();
    } catch (e) {
      // ignore
    }
    await closePopUp(this.page);

    await expect(this.serviceAccountMenuLink).toHaveCount(1, { timeout: 2000 });
    await this.serviceAccountMenuLink.click();
    await expect(this.serviceAccountHeading).toHaveCount(1);

    // Wait for initial load
    await this.page.waitForSelector(AbstractPage.progressBarLocatorString, {
      state: 'detached',
      timeout: config.serviceAccountCreationTimeout
    });

    // Wait for reload caused by a bug https://issues.redhat.com/browse/MGDX-405
    try {
      await this.page.waitForSelector(AbstractPage.progressBarLocatorString, {
        state: 'attached',
        timeout: 10000
      });
      // Secondary refresh started, wait for detach
      await this.page.waitForSelector(AbstractPage.progressBarLocatorString, {
        state: 'detached',
        timeout: 10000
      });
    } catch (e) {
      // ignore
    }
    await expect(this.createServiceAccountButton).toHaveCount(1);
  }

  async createServiceAccount(name: string) {
    await this.createServiceAccountButton.click();

    await expect(this.page.getByText('Create a service account', { exact: true })).toHaveCount(1);

    await this.page.waitForSelector('[role=progressbar]', { state: 'detached' });

    await this.serviceAccountDescription.fill(name);

    await this.createButton.click();

    await expect(this.page.getByText('Credentials successfully generated')).toHaveCount(1);

    const clientID = await this.clientId.inputValue();
    const clientSecret = await this.clientSecret.inputValue();

    await this.page.getByLabel('I have copied the client ID and secret').check();

    // data-testid=modalCredentials-buttonClose
    await expect(this.closeButton).toBeEnabled();

    // data-testid=modalCredentials-buttonClose
    await this.closeButton.click();

    // check for the service account to have been created
    const table = await this.serviceAccountTable;
    await expect(table.getByText(name)).toHaveCount(1);

    resourceStore.addServiceAccount(name);

    return { clientID: clientID, clientSecret: clientSecret };
  }

  async deleteServiceAccount(name: string) {
    const saLinkSelector = this.page.locator('td', { hasText: name });
    const row = this.page.locator('tr', { has: saLinkSelector.nth(0) });

    await row.locator(AbstractPage.actionsLocatorString).nth(0).click();

    await expect(this.deleteServiceAccountButton).toBeEnabled();
    await this.deleteServiceAccountButton.click();
    await this.actionsDeleteButton.click();

    await expect(this.page.locator('td', { hasText: name })).toHaveCount(0, {
      timeout: config.serviceAccountDeletionTimeout
    });

    resourceStore.removeServiceAccount(name);
  }

  async resetServiceAccount(name: string) {
    await this.showElementActions(name);

    await this.resetCredentialsButton.click();

    await this.resetButton.click();

    await expect(this.page.getByText('Credentials successfully generated')).toHaveCount(1);

    const clientID = await this.clientId.inputValue();
    const clientSecret = await this.clientSecret.inputValue();

    await this.page.getByLabel('I have copied the client ID and secret').check();

    // data-testid=modalCredentials-buttonClose
    await expect(this.closeButton).toBeEnabled();

    // data-testid=modalCredentials-buttonClose
    await this.closeButton.click();

    return { clientID: clientID, clientSecret: clientSecret };
  }

  async deleteAllServiceAccounts() {
    const saList = resourceStore.getSeviceAccountList;
    await this.gotoThroughMenu();
    for (const saName of saList) {
      try {
        await this.deleteServiceAccount(saName);
      } catch (error) {
        //Ignore exception
      }
    }
    resourceStore.clearServiceAccountList();
  }
}
