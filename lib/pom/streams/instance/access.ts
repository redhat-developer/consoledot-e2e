import { expect, Locator, Page } from '@playwright/test';
import { KafkaInstancePage } from '@lib/pom/streams/kafkaInstance';
import { AbstractPage } from '@lib/pom/abstractPage';

export class AccessPage extends KafkaInstancePage {
  readonly manageAccessButton: Locator;
  readonly optionsMenuButton: Locator;
  readonly dropDownMenu: Locator;
  readonly optionField: Locator;
  readonly produceToTopicButton: Locator;
  readonly enterPrefixField: Locator;
  readonly consumeFromTopicButton: Locator;

  constructor(page: Page, instanceName: string) {
    super(page, instanceName);
    this.manageAccessButton = page.locator('button', { hasText: 'Manage access' });
    this.optionsMenuButton = page.getByRole('button', { name: 'Options menu' });
    this.dropDownMenu = page.getByTestId('permissions-dropdown-toggle');
    this.optionField = page.getByRole('option');
    this.produceToTopicButton = page.locator('button', { hasText: 'Produce to a topic' });
    this.enterPrefixField = page.getByPlaceholder('Enter prefix');
    this.consumeFromTopicButton = page.locator('button', { hasText: 'Consume from a topic' });
  }

  async gotoThroughMenu() {
    await expect(this.kafkaTabNavAccess).toHaveCount(1);
    await this.kafkaTabNavAccess.click();
    await expect(this.manageAccessButton).toHaveCount(1);
  }

  // TODO - we shouldn't use just prefix for topic/group but also complete name
  // TODO - we should click on topic name/prefix when it popups when filling the prefix/name
  async grantProducerAccess(saId: string, topicName: string) {
    await this.manageAccessButton.click();
    await this.optionsMenuButton.click();
    await this.optionField.filter({ hasText: saId }).click();
    await this.nextButton.click();
    await this.dropDownMenu.click();
    // TODO - This is another option which should be tested
    // await page.getByRole('button', { name: 'Add permission' }).click();

    await this.produceToTopicButton.click();

    await this.enterPrefixField.click();
    await this.enterPrefixField.fill(topicName);
    // TODO - This is just a workaround - `save` button is disabled even if the prefix is written but not confirmed by another action
    await this.enterPrefixField.click();

    await this.saveButton.click();
  }

  // TODO - we shouldn't use just prefix for topic/group but also complete name
  // TODO - we should click on topic name/prefix when it popups when filling the prefix/name
  async grantConsumerAccess(saId: string, topicName: string, consumerGroup: string) {
    await this.manageAccessButton.click();
    await this.optionsMenuButton.click();
    await this.optionField.filter({ hasText: saId }).click();
    await this.nextButton.click();
    await this.dropDownMenu.click();

    await this.consumeFromTopicButton.click();

    // TODO - these selectors should be added to class as well
    await this.page
      .getByRole('row', {
        name: 'T Topic Options menu permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu Label group category'
      })
      .getByPlaceholder('Enter prefix')
      .click();

    await this.page
      .getByRole('row', {
        name: 'T Topic Options menu permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu Label group category'
      })
      .getByPlaceholder('Enter prefix')
      .fill(topicName);

    await this.page
      .getByRole('gridcell', {
        name: 'permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu'
      })
      .getByPlaceholder('Enter prefix')
      .click();

    await this.page
      .getByRole('gridcell', {
        name: 'permission.manage_permissions_dialog.assign_permissions.resource_name_aria Options menu'
      })
      .getByPlaceholder('Enter prefix')
      .fill(consumerGroup);

    await this.saveButton.click();
  }

  async grantManageAccess(saId: string) {
    await this.manageAccessButton.click();
    await this.optionsMenuButton.click();
    await this.optionField.filter({ hasText: saId }).click();
    await this.nextButton.click();
    await this.dropDownMenu.click();

    await this.page
      .getByRole('menuitem', {
        name: 'Manage access Provides access to add and remove permissions on this Kafka instance'
      })
      .click();

    await this.saveButton.click();
  }

  async findAccessRow(account: string, permission: string, resource: string) {
    return this.page
      .locator('tr')
      .filter({ has: this.page.getByText(account) })
      .filter({ has: this.page.getByText(permission) })
      .filter({ has: this.page.getByText(resource) });
  }

  async revokeAccess(account: string, permission: string, resource: string, awaitDeletion: boolean) {
    const row = await this.findAccessRow(account, permission, resource);
    if ((await row.count()) == 1) {
      // GetByRole sometimes works, sometimes it does not.
      // await row.getByRole('button', { name: 'Actions' }).click();
      await row.locator(AbstractPage.actionsLocatorString).click();
      await this.deleteButton.click();

      // await for the permission to be revoked
      if (awaitDeletion) {
        await expect(row).toHaveCount(0);
      }
    }
  }
}
