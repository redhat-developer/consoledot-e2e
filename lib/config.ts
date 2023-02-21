import { v1 as uuid } from 'uuid';

class Config {
  readonly username: string;
  readonly password: string;
  readonly username_2: string;
  readonly password_2: string;
  readonly adminUsername: string;
  readonly adminPassword: string;
  // Billing credentials
  readonly stratosphere1username: string;
  readonly stratosphere2username: string;
  readonly stratosphere3username: string;
  readonly stratosphere4username: string;
  readonly stratospherePassword: string;

  readonly startingPage: string;
  readonly sessionID: string;
  readonly instanceName: string;

  readonly kafkaInstanceCreationTimeout: number;
  readonly kafkaInstanceDeletionTimeout: number;
  readonly serviceRegistryInstanceCreationTimeout: number;
  readonly serviceRegistryInstanceDeletionTimeout: number;

  readonly minKafkaStreamingUnits: number;
  readonly maxKafkaStreamingUnits: number;

  readonly serviceAccountCreationTimeout: number;
  readonly serviceAccountDeletionTimeout: number;

  readonly startingPageDefault = 'https://console.redhat.com';

  readonly enableErrLogging: boolean;

  constructor() {
    // Load credentials
    this.username = process.env.TEST_USERNAME;
    this.password = process.env.TEST_PASSWORD;
    this.username_2 = process.env.TEST_2_USERNAME;
    this.password_2 = process.env.TEST_2_PASSWORD;
    this.adminUsername = process.env.TEST_ADMIN_USERNAME;
    this.adminPassword = process.env.TEST_ADMIN_PASSWORD;
    this.stratosphere1username = process.env.STRATOSPHERE_SCENARIO_1_USER;
    this.stratosphere2username = process.env.STRATOSPHERE_SCENARIO_2_USER;
    this.stratosphere3username = process.env.STRATOSPHERE_SCENARIO_3_USER;
    this.stratosphere4username = process.env.STRATOSPHERE_SCENARIO_4_USER;
    this.stratospherePassword = process.env.STRATOSPHERE_SCENARIO_PASSWORD;

    // Setup starting page
    this.startingPage = process.env.STARTING_PAGE || this.startingPageDefault;
    // Generate names for components
    this.sessionID = uuid().substring(0, 16);
    this.instanceName = process.env.INSTANCE_NAME;
    if (this.instanceName == undefined) {
      this.instanceName = `test-instance-${this.sessionID}`;
    }
    // Timeouts
    this.kafkaInstanceCreationTimeout = 20 * 60 * 1000; // 20 minutes
    this.kafkaInstanceDeletionTimeout = 10 * 60 * 1000; // 10 minutes
    this.serviceRegistryInstanceCreationTimeout = 1 * 60 * 1000; // 1 minute
    this.serviceRegistryInstanceDeletionTimeout = 1 * 60 * 1000; // 1 minute

    this.minKafkaStreamingUnits = 1;
    this.maxKafkaStreamingUnits = 2;

    this.serviceAccountCreationTimeout = 30 * 1000; // 30 seconds
    this.serviceAccountDeletionTimeout = 30 * 1000; // 30 seconds

    //logging
    this.enableErrLogging = !!process.env.ENABLE_ERR_LOGGING;
  }
}

export const config = new Config();
