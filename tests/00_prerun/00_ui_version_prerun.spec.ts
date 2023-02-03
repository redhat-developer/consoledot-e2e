import { test } from '@playwright/test';
import { component_versions } from '@lib/component_versions';
import fs from 'fs';

test('prerun component versions', async ({}, testInfo) => {
  const start_components_versions = await component_versions();

  await fs.promises.writeFile(
    `./start-component-versions-${testInfo.project.name}.json`,
    JSON.stringify(start_components_versions),
    'utf8'
  );

  console.log('Prerun UI component versions:');
  console.log(start_components_versions);
});
