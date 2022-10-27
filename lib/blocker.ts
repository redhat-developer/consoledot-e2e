import { Page } from "@playwright/test";

export default async function blockAnalyticsDomains(page: Page) {
  await page.route('**/*', route => {
    const blockedUrls = [
      'trustarc',
      'dpal.js',
      'analytics',
      'segment.com'
    ]
    const url = route.request().url();
    return blockedUrls.some(blocked => url.includes(blocked))
      ? route.abort()
      : route.continue();
  })
}
