import { expect, Locator, Page } from '@playwright/test';
import { TopicListPage } from '@lib/pom/streams/instance/topicList';
import { config } from '@lib/config';

export class PropertiesPage extends TopicListPage {
  readonly topicName: string;
  readonly propertiesMenuButton: Locator;
  readonly editPropertiesButton: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.propertiesMenuButton = page.locator('button', { hasText: 'Properties' });
    this.editPropertiesButton = page.locator('button', { hasText: 'Edit properties' });

    if (config.newUIcodebase) {
      this.propertiesMenuButton = page.locator('li[data-ouia-component-id="tab-Permissions"]');
    }
  }

  async gotoThroughMenu() {
    await expect(this.propertiesMenuButton).toHaveCount(1);
    await this.propertiesMenuButton.click();
    await expect(this.editPropertiesButton).toHaveCount(1);
  }
}
