import { test, expect } from '@playwright/test';

test('can create and delete instances', async ({ page }) => {
  // page.on('request', (request) => {
  //   console.log(`Request: ${request.url()} to resource type: ${request.resourceType()}`);
  // });
  // block the marketing scripts to reduce the number of popups we have to accept
  page.route('**/*', route => {
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
  await page.goto('https://console.redhat.com/application-services/streams/kafkas');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Log In | Red Hat IDP/);

  async function marketingOverlaysGoAway() {
    if (await page.$('[role="PF4/ModalContent"]')) {
      await page.getByText('Cancel').click();
    }
  }

  // do login
  await page.locator('#username-verification').fill(process.env.RH_USERNAME!);
  await page.getByText('Next').click();
  await page.locator('#password').fill(process.env.RH_PASSWORD!);
  await page.locator('#rh-password-verification-submit-button').click();

  await marketingOverlaysGoAway();

  // check we landed on the right page
  await expect(page).toHaveTitle(/Streams for Apache Kafka.*/, { timeout: 10000 });

  // create a Kafka instance
  await page.getByText('Create Kafka instance').click();
  await page.waitForSelector('[role=progressbar]', { state: "detached"});
  await expect(page.getByLabel('Name')).toBeEnabled();
  await page.getByLabel('Name').fill('test-instance');
  await page.getByTestId('modalCreateKafka-buttonSubmit').click();

  // wait for the table to appear
  const table = await page.locator('[data-ouia-component-id=table-kafka-instances]');

  // check for the instance to have been created
  await expect(table.getByText('test-instance')).toBeTruthy();
  await expect.soft(table.getByText('Creation in progress')).toBeTruthy();

  // delete the created instance
  await table.locator('[aria-label="Actions"]').last().click();
  await table.getByText('Delete').click();
  await page.locator('#confirm__button').click();

  // wait for deletion
  await page.waitForSelector('test-instance', { state: 'detached'});

  // check to be in the initial empty state
  await page.locator('No Kafka instances');
});
