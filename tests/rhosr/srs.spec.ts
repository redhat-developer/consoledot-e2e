import { test } from '@lib/utils/fixtures';
import { config } from '@lib/config';

// Define name of Service Registry instance for this set of tests
const testInstanceName = config.instanceName;

// Use admin user context
test.use({ storageState: config.adminAuthFile });

// Test: Create and delete Service Registry instance with waiting for its readiness
test('create, wait for ready and delete a Service Registry instance',
    async ({ serviceRegistryPage }) => {
  // Create instance
  await serviceRegistryPage.createServiceRegistryInstance(testInstanceName);
  // Wait for instance readiness
  await serviceRegistryPage.waitForServiceRegistryReady(testInstanceName);
  // Delete instance
  await serviceRegistryPage.deleteServiceRegistryInstance(testInstanceName);
});
