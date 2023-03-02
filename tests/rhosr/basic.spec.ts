import { test } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { ServiceRegistryPage } from '@lib/pom/serviceRegistry/serviceRegistry';

test('perform login', async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  const serviceRegistryPage = new ServiceRegistryPage(page);
  await consoleDotAuthPage.login();

  // navigate to Service Registry
  await serviceRegistryPage.gotoThroughMenu();
});
