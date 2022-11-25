import { test, expect } from '@playwright/test';
import { config } from '@lib/config';
import login from '@lib/auth';

// test_1auth.py test_auth_logged_in
test('perform login', async ({ page }) => {
  await login(page);

  // navigate to Kafka
  await page.locator('#chr-c-sidebar').getByText('Application and Data Services').click();
  await page
    .getByRole('heading', {
      name: 'Red Hat OpenShift Streams for Apache Kafka'
    })
    .click();
  await page.getByRole('button', { name: 'Streams for Apache Kafka' }).click();
  await page.getByRole('region', { name: 'Streams for Apache Kafka' }).getByRole('link', { name: 'Overview' }).click();

  await expect(page).toHaveTitle(/Overview | Streams for Apache Kafka | Red Hat OpenShift Application Services/);
  await expect(page.getByRole('heading', { name: /Get started with Red Hat OpenShift/ })).toBeVisible();
});

// test_1auth.py test_auth_log_out
test('perform login and logout', async ({ page }) => {
  await login(page);

  await page.getByRole('button', { name: /User Avatar/ }).click();
  await page.getByRole('menuitem', { name: 'Log out' }).click();

  await expect(page).toHaveTitle(/Log In | Red Hat IDP/);
});

// test_4kafka.py test_kafka_404_not_found_global
test('404 not found Global', async ({ page }) => {
  await login(page);

  await page.goto(config.startingPage + '/application-services/streams/kafka');
  await expect(page.getByRole('heading', { name: '404 Page not found' })).toHaveCount(1);
});
