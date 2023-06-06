import { expect } from '@playwright/test';
import { test } from '@lib/utils/fixtures';
import { config } from '@lib/config';

test.use({ storageState: config.adminAuthFile });

test.describe('kafka instance manage access tests', () => {
  test.skip(
    true,
    'Reported here https://issues.redhat.com/browse/MGDX-384'
    //config.username_2 == undefined || config.password_2 == undefined,
    //'Secondary user has to be defined for this test.'
  );

  // This test needs to run as an org admin until the new UI with refactored access dialog is released.
  test('test kafka manage access permission', async ({ kafkaAccessPage,
                                                       consoleDotAuthPage }) => {

    await kafkaAccessPage.grantManageAccess(config.username_2);

    const row = await kafkaAccessPage.findAccessRow(config.username_2, '', 'Kafka Instance');
    await expect(row).toHaveCount(1);

    await consoleDotAuthPage.logout();
    await consoleDotAuthPage.login(config.username_2, config.password_2);

    await kafkaAccessPage.gotoThroughMenu();
    await kafkaAccessPage.grantManageAccess('All accounts');

    const rowAllAccounts = await kafkaAccessPage.findAccessRow('All Accounts', 'Alter', 'Kafka Instance');
    await expect(rowAllAccounts).toHaveCount(1);

    await kafkaAccessPage.revokeAccess('All Accounts', 'Alter', 'Kafka Instance', true);
    await kafkaAccessPage.revokeAccess(config.username_2, 'Alter', 'Kafka Instance', true);
  });
});
