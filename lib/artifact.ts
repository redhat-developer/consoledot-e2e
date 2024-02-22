import { expect, Page } from '@playwright/test';

// Navigates to artifacts list of Service Registry instance defined by name
export const navigateToServiceRegistryArtifactsList = async function (page: Page, serviceRegistryName: string) {
  // Check that there is one link of defined instance
  await expect(await page.locator('a', { hasText: serviceRegistryName })).toHaveCount(1);
  // Click link of instance
  await page.locator('a', { hasText: serviceRegistryName }).click();
  // Check that there is tab button for artifacts
  await expect(await page.locator('button', { hasText: /Artifacts/ })).toHaveCount(1);
  // Click tab button for artifacts
  await page.locator('button', { hasText: /Artifacts/ }).click();
};

// Creates artifact in Service registry instance defined by group, id, type and content
export const createServiceRegistryArtifact = async function (
  page: Page,
  group: string,
  id: string,
  type: string,
  content: string
) {
  // Click button for uploading artifact
  await page.getByTestId('btn-header-upload-artifact').click();
  // Check that modal title is present
  await expect(page.getByRole('heading', { name: /Upload Artifact/ })).toHaveCount(1);
  // Fill group of artifact
  await page.getByPlaceholder('Group').fill(group);
  // Fill ID of artifact
  await page.getByPlaceholder('ID of the artifact').fill(id);
  // Click type dropdown to open it
  await page.locator('button:has-text("Auto-Detect")').click();
  // Select defined type of artifact
  await page.getByText(type).first().click();
  // Fill content of artifact
  await page.locator('#artifact-content').fill(content);
  // Click upload button
  await page.getByTestId('modal-btn-upload').click();
  // Wait for load of artifact page
  await expect(page.getByText(id, { exact: true })).toHaveCount(3);
};

// Deletes artifact in Service Registry instance defined by group and id
export const deleteServiceRegistryArtifact = async function (page: Page, group: string, id: string) {
  // Click first occurrence of group to filter artifacts by this group
  await page.getByText(group).first().click();
  // Click artifact id to open artifact page
  await page.getByText(id, { exact: true }).click();
  // Click delete button on artifact page
  await page.locator('button', { hasText: 'Delete' }).click();
  // Click delete button on deletion modal
  await page.getByTestId('modal-btn-delete').click();
  // Wait for disappearance of artifact id
  await expect(page.getByText(id)).toHaveCount(0);
};
