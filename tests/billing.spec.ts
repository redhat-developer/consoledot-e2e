import login from "@lib/auth";
import { BillingOptions } from "@lib/billing";
import { config } from "@lib/config";
import { createKafkaInstance, deleteKafkaInstance, navigateToKafkaList, showKafkaDetails } from "@lib/kafka";
import test, { Page } from "@playwright/test";

const testInstanceName = 'mk-ui-playwright-tests';
let currentUsername = config.stratosphere1username

test.afterEach(async ({ page }) => {
    await login(page, currentUsername, config.stratospherePassword);
    await navigateToKafkaList(page);
    await deleteKafkaInstance(page, testInstanceName);
})

async function setupKafkaFreshInstance(page: Page) {
    await navigateToKafkaList(page);
    await deleteKafkaInstance(page, testInstanceName);
    await createKafkaInstance(page, testInstanceName, false);
}
  
// Tests that user with all different billing options can create Kafka succesfully
const users = [config.stratosphere1username, config.stratosphere2username, config.stratosphere3username]
for (const user of users) {
    test(`Billing check of user: ${user}`, async ({ page }) => {
        currentUsername = user
        await login(page, user, config.stratospherePassword);
    
        await setupKafkaFreshInstance(page);
        await showKafkaDetails(page);
    })
}

// Tests that different billing options are properly set in instance details
const billingOptions = [BillingOptions.AWS, BillingOptions.RH, BillingOptions.PREPAID]
for (const billingOption of billingOptions) {
    test(`Billing option for stratosphere4: ${billingOption}`, async ({ page }) => {
        currentUsername = config.stratosphere4username
        await login(page, currentUsername, config.stratospherePassword);
        
        switch(billingOption) {
            case BillingOptions.PREPAID:
                break;
            case BillingOptions.AWS:
                break;
            case BillingOptions.RH:
                break;
        }
    })
}