import { chromium } from '@playwright/test';
import { config as testConfig } from './config';
import { ConsoleDotAuthPage } from '@lib/pom/auth';
import config from '../playwright.config';

export default async function globalSetup() {
  const users = [
    {
      name: testConfig.adminUsername,
      password: testConfig.adminPassword,
      path: testConfig.adminAuthFile
    },
    {
      name: testConfig.username,
      password: testConfig.password,
      path: testConfig.user1AuthFile
    },
    {
      name: testConfig.username_2,
      password: testConfig.password_2,
      path: testConfig.user2AuthFile
    }
  ];

  for (const user of users) {
    if (user.name != undefined) {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        ignoreHTTPSErrors: config.use.ignoreHTTPSErrors
      });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.localStorage.setItem('chrome:analytics:disable', String(true));
        window.localStorage.setItem('chrome:segment:disable', String(true));
      });
      const consoleDotAuthPage = new ConsoleDotAuthPage(page);
      await consoleDotAuthPage.login(user.name, user.password);
      await page.context().storageState({ path: user.path as string });
      await browser.close();
    }
  }
}
