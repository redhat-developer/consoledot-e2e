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
    },
    {
      name: testConfig.stratosphere1username,
      password: testConfig.stratospherePassword,
      path: testConfig.stratosphere1AuthFile
    },
    {
      name: testConfig.stratosphere2username,
      password: testConfig.stratospherePassword,
      path: testConfig.stratosphere2AuthFile
    },
    {
      name: testConfig.stratosphere3username,
      password: testConfig.stratospherePassword,
      path: testConfig.stratosphere3AuthFile
    },
    {
      name: testConfig.stratosphere4username,
      password: testConfig.stratospherePassword,
      path: testConfig.stratosphere4AuthFile
    }
  ];

  for (const user of users) {
    if (user.name != undefined) {
      const browser = await chromium.launch();
      const context = await browser.newContext({
        ignoreHTTPSErrors: config.use.ignoreHTTPSErrors
      });
      const page = await context.newPage();
      const consoleDotAuthPage = new ConsoleDotAuthPage(page);
      await consoleDotAuthPage.login(user.name, user.password);
      await page.context().storageState({ path: user.path as string });
      await browser.close();
    }
  }
}
