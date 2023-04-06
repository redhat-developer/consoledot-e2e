import { expect, Locator, Page } from '@playwright/test';
import { TopicListPage } from '@lib/pom/streams/instance/topicList';
import { resourceStore } from '@lib/resource_store';

export class PropertiesPage extends TopicListPage {
  readonly topicName: string;
  readonly propertiesMenuButton: Locator;
  readonly editPropertiesButton: Locator;
  readonly partitionsInput: Locator;
  readonly retentionTimeInput: Locator;
  readonly retentionSizeInput: Locator;
  readonly cleanupPolicyInput: Locator;
  readonly numPartitionsInput: Locator;
  readonly numPartitionsButton: Locator;
  readonly deleteTopicLink: Locator;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.propertiesMenuButton = page.locator('a', { hasText: 'Properties' });
    this.editPropertiesButton = page.locator('a', { hasText: 'Edit properties' });
    this.partitionsInput = page.locator('input[id="partitions"]');
    this.retentionTimeInput = page.locator('input[id="retention-time"]');
    this.retentionSizeInput = page.locator('input[id="retention-size"]');
    this.cleanupPolicyInput = page.locator('input[id="cleanup-policy"]');
    this.numPartitionsInput = page.locator('input[name="num-partitions"]');
    this.numPartitionsButton = page.locator('button[name="num-partitions"]');
    this.deleteTopicLink = page.locator('a', { hasText: 'Delete topic' });
  }

  async gotoThroughMenu() {
    await expect(this.propertiesMenuButton).toHaveCount(1);
    await this.propertiesMenuButton.click();
    await expect(this.editPropertiesButton).toHaveCount(1);
  }

  async deleteKafkaTopic() {
    await this.deleteTopicLink.click();
    await this.deleteNameInput.fill(this.topicName);
    await this.deleteButton.click();

    await expect(this.page.getByText(this.topicName)).toHaveCount(0);
    resourceStore.removeKafkaTopic(this.topicName);
  }
}
