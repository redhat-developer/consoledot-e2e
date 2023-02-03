import { expect, test } from '@playwright/test';
import { component_versions } from '@lib/component_versions';
import fs from 'fs';

/**
 * Read file containing UI component versions.
 * If readFile fails to open the file, return empty object.
 * @param testInfo object
 */
export const get_start_components_versions = async function (testInfo) {
  let versions = null;
  try {
    versions = await fs.promises.readFile(`./start-component-versions-${testInfo.project.name}.json`, 'utf8');
  } catch (error) {
    //Ignore exception
  }

  return versions ? JSON.parse(versions) : {};
};

test.describe.configure({ retries: 0 });
test('postrun component versions', async ({}, testInfo) => {
  const start_components = await get_start_components_versions(testInfo);
  const end_components_versions = await component_versions();

  console.info('Postrun components versions:');
  console.info(end_components_versions);

  // Attach file to the playwright trace
  await testInfo.attach(`component-versions-${testInfo.project.name}.json`, {
    body: JSON.stringify(end_components_versions),
    contentType: 'application/json'
  });
  // Save component versions to a JSON file
  await fs.promises.writeFile(
    `./component-versions-${testInfo.project.name}.json`,
    JSON.stringify(end_components_versions),
    'utf8'
  );

  // verify that the start versions are the same as the end versions otherwise it
  // means one or more components has updated during the test suite run
  await expect(start_components).toEqual(end_components_versions);
});
