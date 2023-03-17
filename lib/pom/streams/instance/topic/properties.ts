import { expect, Locator, Page } from '@playwright/test';
import { TopicListPage } from '@lib/pom/streams/instance/topicList';

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
  }

  async gotoThroughMenu() {
    await expect(this.propertiesMenuButton).toHaveCount(1);
    await this.propertiesMenuButton.click();
    await expect(this.editPropertiesButton).toHaveCount(1);
  }
}
