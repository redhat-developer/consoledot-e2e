import { chromium } from '@playwright/test';
import { config } from './config';
import { ConsoleDotAuthPage } from '@lib/pom/auth';

export default async function globalSetup() {
  const users = [
    {
      name: config.adminUsername,
      password: config.adminPassword,
      path: config.adminAuthFile
    },
    {
      name: config.username,
      password: config.password,
      path: config.user1AuthFile
    },
    {
      name: config.username_2,
      password: config.password_2,
      path: config.user2AuthFile
    },
    {
      name: config.stratosphere1username,
      password: config.stratospherePassword,
      path: config.stratosphere1AuthFile
    },
    {
      name: config.stratosphere2username,
      password: config.stratospherePassword,
      path: config.stratosphere2AuthFile
    },
    {
      name: config.stratosphere3username,
      password: config.stratospherePassword,
      path: config.stratosphere3AuthFile
    },
    {
      name: config.stratosphere4username,
      password: config.stratospherePassword,
      path: config.stratosphere4AuthFile
    }
  ];

  for (const user of users) {
    if (user.name != undefined) {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      const consoleDotAuthPage = new ConsoleDotAuthPage(page);
      await consoleDotAuthPage.login(user.name, user.password);
      await page.context().storageState({ path: user.path as string });
      await browser.close();
    }
  }
}
