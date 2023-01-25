import { test, expect } from '@playwright/test';
import login, { logout } from '@lib/auth';

test('perform login', async ({ page }) => {
  await login(page);

  // navigate to Service Registry
  await page.locator('#chr-c-sidebar').getByText('Application and Data Services').click();
  await page
    .getByRole('heading', {
      name: 'Red Hat OpenShift Service Registry'
    })
    .click();
  await page.getByRole('button', { name: 'Service Registry' }).click();
  await page.getByRole('region', { name: 'Service Registry' }).getByRole('link', { name: 'Service Registry Instances' }).click();

  await expect(page).toHaveTitle(/Service Registry | Red Hat OpenShift Application Services/);
  await expect(page.getByRole('heading', { name: /Service Registry Instances/ })).toBeVisible();
});

test('perform login and logout', async ({ page }) => {
  await login(page);

  await logout(page);

  await expect(page).toHaveTitle(/Log In | Red Hat IDP/);
});
