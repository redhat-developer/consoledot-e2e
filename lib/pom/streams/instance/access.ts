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
  readonly enterNameField: Locator;
  readonly consumeFromTopicButton: Locator;
  readonly createPrefixTopicConfirmButton: Locator;
  readonly topicConsumePermissionRow: Locator;
  readonly consumerGroupConsumePermissionRow: Locator;
  readonly permissionRowCheckBox: Locator;
  readonly toolbarKebabMenu: Locator;
  readonly deleteSelectedPermissions: Locator;

  constructor(page: Page, instanceName: string) {
    super(page, instanceName);
    this.manageAccessButton = page.locator('button', { hasText: 'Manage access' });
    this.optionsMenuButton = page.getByRole('button', { name: 'Options menu' });
    this.dropDownMenu = page.getByTestId('permissions-dropdown-toggle');
    this.optionField = page.getByRole('option');
    this.produceToTopicButton = page.locator('button', { hasText: 'Produce to a topic' });
    this.enterPrefixField = page.getByPlaceholder('Enter prefix');
    this.enterNameField = page.getByPlaceholder('Enter name');
    this.consumeFromTopicButton = page.locator('button', { hasText: 'Consume from a topic' });
    this.createPrefixTopicConfirmButton = page.locator('button', { hasText: /Create.+/ });
    this.topicConsumePermissionRow = page.locator('tr', { hasText: 'Topic' });
    this.consumerGroupConsumePermissionRow = page.locator('tr', { hasText: 'Consumer group' });
    this.permissionRowCheckBox = page.locator('input[type="checkbox"]');
    // TODO - Change toolbarKebabMenu locator once IDs are in place
    this.toolbarKebabMenu = page
      .locator('main')
      .locator('[data-ouia-component-type="PF4/Toolbar"]')
      .locator('button[aria-label="Actions"]');
    this.deleteSelectedPermissions = page.locator('button:text-is("Delete selected permissions")');
  }

  async gotoThroughMenu() {
    await expect(this.kafkaTabNavAccess).toHaveCount(1);
    await this.kafkaTabNavAccess.click();
    await expect(this.manageAccessButton).toHaveCount(1);
    await expect(this.loadingContent.first()).toBeHidden();
  }

  async gotoFromAnywhere() {
    await super.gotoUrl();
    await super.gotoThroughMenu();
    await this.gotoThroughMenu();
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

    await this.enterNameField.click();
    await this.enterNameField.fill(topicName);
    await this.page.locator('button', { hasText: topicName }).click();

    await this.saveButton.click();

    // Verify permissions were granted
    await expect(await this.findAccessRow(saId, 'Create', topicName)).toHaveCount(1);
    await expect(await this.findAccessRow(saId, 'Write', topicName)).toHaveCount(1);
    await expect(await this.findAccessRow(saId, 'Describe', topicName)).toHaveCount(1);
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
    const placeholder = 'Enter name';
    await this.topicConsumePermissionRow.getByPlaceholder(placeholder).click();
    await this.topicConsumePermissionRow.getByPlaceholder(placeholder).fill(topicName);
    await this.page.locator('button', { hasText: topicName }).click();
    await this.consumerGroupConsumePermissionRow.getByPlaceholder(placeholder).click();
    await this.consumerGroupConsumePermissionRow.getByPlaceholder(placeholder).fill(consumerGroup);
    await this.page.locator('button', { hasText: consumerGroup }).click();
    await this.saveButton.click();

    // Verify permissions were granted
    await expect(await this.findAccessRow(saId, 'Read', consumerGroup)).toHaveCount(1);
    await expect(await this.findAccessRow(saId, 'Describe', topicName)).toHaveCount(1);
    await expect(await this.findAccessRow(saId, 'Read', topicName)).toHaveCount(1);
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
    const rows = await this.findAccessRow(account, permission, resource);
    if ((await rows.count()) == 1) {
      // GetByRole sometimes works, sometimes it does not.
      // await row.getByRole('button', { name: 'Actions' }).click();
      await rows.locator(AbstractPage.actionsLocatorString).click();
      await this.deleteButton.click();

      // await for the permission to be revoked
      if (awaitDeletion) {
        await expect(rows).toHaveCount(0);
      }
    } else if ((await rows.count()) > 1) {
      for (const row of await rows.all()) {
        await row.locator(this.permissionRowCheckBox).check();
      }
      await this.toolbarKebabMenu.click();
      await this.deleteSelectedPermissions.click();

      // await for the permission to be revoked
      if (awaitDeletion) {
        await expect(rows).toHaveCount(0);
      }
    }
  }
}
