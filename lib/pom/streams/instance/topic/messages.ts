import { expect, Locator, Page } from '@playwright/test';
import { TopicListPage } from '../topicList';
import { FilterGroup, Limit } from '@lib/enums/messages';

export class MessagesPage extends TopicListPage {
  readonly topicName: string;
  readonly messageMenuButton: Locator;
  readonly messageTable: Locator;
  readonly checkForNewDataButton: Locator;
  readonly searchButton: Locator;
  readonly filterGroup: Locator;
  readonly specifyPartitionValue: string;
  readonly specifyOffset: string;
  readonly datePicker: string;
  readonly specifyEpochTimestamp: string;

  constructor(page: Page, instanceName: string, topicName: string) {
    super(page, instanceName);
    this.topicName = topicName;
    this.messageMenuButton = page.locator('li[data-ouia-component-id="tab-Topics"]');
    this.messageTable = page.locator('table[aria-label="Messages table"]');
    this.checkForNewDataButton = page.locator('button', { hasText: 'Check for new data' });
    this.searchButton = page.locator('button[aria-label="Search"]');
    this.filterGroup = page.locator('[data-testid="filter-group"]');
    this.specifyPartitionValue = '[aria-label="Specify partition value"]';
    this.specifyOffset = '[aria-label="Specify offset"]';
    this.datePicker = '[aria-label="Date picker"]';
    this.specifyEpochTimestamp = '[aria-label="Specify epoch timestamp"]';
  }

  async gotoThroughMenu() {
    await expect(this.messageMenuButton).toHaveCount(1);
    await this.messageMenuButton.click();
    try {
      await expect(this.checkForNewDataButton).toHaveCount(1);
    } catch (e) {
      await expect(this.messageTable).toHaveCount(1);
    }
  }

  async refreshMessages() {
    try {
      await expect(this.messageTable).toHaveCount(1);
    } catch (e) {
      await this.checkForNewDataButton.click({ timeout: 5000 });
      await this.refreshMessages();
    }
  }

  async pickFilterOption(option: FilterGroup) {
    await this.filterGroup.click();
    await this.page.locator('a:text-is("' + option + '")').click();
  }

  async setField(locator: string, value: string) {
    await this.page.locator(locator).click();
    await this.page.locator(locator).fill(value);
  }

  async setPartition(partition: string) {
    await this.setField(this.specifyPartitionValue, partition);
  }

  async setOffset(offset: string) {
    await this.setField(this.specifyOffset, offset);
  }

  async setTimestamp(timestamp: string) {
    await this.setField(this.datePicker, timestamp);
  }

  async setEpoch(epochTimestamp: number) {
    await this.setField(this.specifyEpochTimestamp, epochTimestamp.toString());
  }

  async setLimit(limit: Limit) {
    await this.page.locator('button >> text=/\\d+ messages/i').click();
    await this.page.locator('li >> button:has-text("' + limit + ' messages")').click();
  }

  async filterMessagesByOffset(partition: string, offset: string, limit: Limit) {
    await this.setPartition(partition);
    await this.setOffset(offset);
    await this.setLimit(limit);

    await this.applyFilter();
  }

  async applyFilter() {
    await this.searchButton.click();
  }
}
