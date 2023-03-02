import { test, expect } from '@playwright/test';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import { KafkaInstanceListPage } from '@lib/pom/streams/kafkaInstanceList';

// test_1auth.py test_auth_logged_in
test('perform login', async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  const kafkaInstacesPage = new KafkaInstanceListPage(page);
  await consoleDotAuthPage.login();
  await kafkaInstacesPage.gotoThroughMenu();

  await page.getByRole('region', { name: 'Streams for Apache Kafka' }).getByRole('link', { name: 'Overview' }).click();

  await expect(page).toHaveTitle(/Overview | Streams for Apache Kafka | Red Hat OpenShift Application Services/);
  await expect(page.getByRole('heading', { name: /Get started with Red Hat OpenShift/ })).toBeVisible();
});

// test_1auth.py test_auth_log_out
test('perform login and logout', async ({ page }) => {
  const consoleDotAuthPage = new ConsoleDotAuthPage(page);
  await consoleDotAuthPage.login();

  await consoleDotAuthPage.logout();

  await expect(page).toHaveTitle(/Log In | Red Hat IDP/);
});
