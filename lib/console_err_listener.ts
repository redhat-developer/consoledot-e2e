import { Page } from '@playwright/test';

/**
  Adds consolelog listeners
 */
export const addConsoleLogListeners = async function (page: Page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error(`Error: "${msg.text()}"`);
  });

  page.on('pageerror', (err) => {
    console.error(`PageError: ${err.message}`);
  });

  page.on('requestfailed', (request) => {
    console.error(`Request failed: ${request.url()} ${request.failure().errorText}`);
  });
};
