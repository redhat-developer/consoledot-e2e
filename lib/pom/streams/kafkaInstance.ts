import { expect, Locator, Page } from '@playwright/test';
import { KafkaInstancesPage } from '@lib/pom/streams/kafkaInstances';
import { config } from '@lib/config';
import { AbstractPage } from '@lib/pom/abstractPage';

export class KafkaInstancePage extends KafkaInstancesPage {
  readonly instanceName: string;
  readonly connectionButton: Locator;
  readonly detailsButton: Locator;
  readonly deleteButton: Locator;
  readonly instanceLink: Locator;

  constructor(page: Page, instanceName: string) {
    super(page);
    this.urlPath = this.urlPath + '/' + instanceName + '/topics';
    this.instanceName = instanceName;
    this.connectionButton = page.locator('a', { hasText: 'Connection' });
    this.detailsButton = page.locator('a', { hasText: 'Details' });
    this.deleteButton = page.locator('a', { hasText: 'Delete' });
    this.instanceLink = page.locator('a', { hasText: this.instanceName });
  }

  async goto() {
    await this.page.goto(config.startingPage + this.urlPath);
    // TODO some expect???
  }

  async gotoThroughMenu() {
    await expect(this.page.getByText(this.instanceName)).toHaveCount(1);
    await this.instanceLink.click();
  }

  async showInstanceActions() {
    await this.page.locator(AbstractPage.actionsLocatorString).click();
  }

  async showConnection() {
    await this.showInstanceActions();
    await this.connectionButton.click();
  }

  async showDetails() {
    await this.showInstanceActions();
    await this.detailsButton.click();
  }

  async deleteInstance(name: string) {
    await this.showInstanceActions();
    await this.deleteButton.click();

    // Duplicity from parent class, how to solve that because previous part is different
    try {
      await expect(this.deleteNameInput).toHaveCount(1, { timeout: 5000 });

      // FIXME: workaround for https://github.com/redhat-developer/app-services-ui-components/issues/590
      // https://github.com/microsoft/playwright/issues/15734#issuecomment-1188245775
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.deleteNameInput.click();

      await this.deleteNameInput.fill(name);
    } catch (err) {
      // Removal without confirmation
      // ignore
    }
    // data-testid=modalDeleteKafka-buttonDelete
    await this.deleteButton.click();
  }

  async closeModalWithInfo() {
    await this.closeDrawerButton.click();
  }
}
