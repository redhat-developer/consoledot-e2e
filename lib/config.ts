import { v1 as uuid } from 'uuid';

class Config {
  readonly username: string;
  readonly password: string;
  readonly startingPage: string;
  readonly sessionID: string;

  readonly kafkaInstanceCreationTimeout: number;
  readonly kafkaInstanceDeletionTimeout: number;

  readonly minKafkaStreamingUnits: number;
  readonly maxKafkaStreamingUnits: number;

  constructor() {
    this.username = process.env.TEST_USERNAME!;
    this.password = process.env.TEST_PASSWORD!;
    this.startingPage = process.env.STARTING_PAGE || "https://console.redhat.com";
    this.sessionID = uuid().substring(0, 16);

    this.kafkaInstanceCreationTimeout = 10 * 60 * 1000; // 5 minutes
    this.kafkaInstanceDeletionTimeout = 5 * 60 * 1000; // 5 minutes

    this.minKafkaStreamingUnits = 1;
    this.maxKafkaStreamingUnits = 2;
  }
}

export const config = new Config();
