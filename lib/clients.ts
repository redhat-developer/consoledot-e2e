import { Consumer, Producer, Kafka, EachMessagePayload, logLevel } from 'kafkajs';

enum Mechanism {
  plain = 'plain',
  oauthbearer = 'oauthbearer'
}

class KafkaClient {
  bootstrapServer: string;
  username: string;
  password: string;
  kafka: Kafka;

  constructor(bootstrapServer: string, username: string, password: string, mechanism: string = Mechanism.plain) {
    this.bootstrapServer = bootstrapServer;
    this.username = username;
    this.password = password;
    if (mechanism == Mechanism.plain) {
      this.kafka = new Kafka({
        brokers: [bootstrapServer],
        ssl: true,
        sasl: {
          mechanism: Mechanism.plain,
          username: username,
          password: password
        },
        logLevel: logLevel.INFO
      });
    } else if (mechanism == Mechanism.oauthbearer) {
      throw new Error('SASL mechanism ' + mechanism + ' is not implemented yet!');
    } else {
      throw new Error('Unknown sasl mechanism: ' + mechanism);
    }
  }
}

export class KafkaProducer extends KafkaClient {
  private producer: Producer;

  constructor(bootstrapServer: string, username: string, password: string) {
    super(bootstrapServer, username, password);
    this.producer = this.kafka.producer();
  }

  async produceMessages(topicName: string, messageCount: number, key: string) {
    await this.producer.connect();

    const messages = this.generateMessages(messageCount, key);
    return await this.producer
      .send({
        topic: topicName,
        messages: messages,
        acks: -1
      })
      .then((response) => {
        this.kafka.logger().info(`Messages sent #${response}`, {
          response,
          messageCount
        });
        return true;
      })
      .catch((e) => {
        this.kafka.logger().error(`[${KafkaProducer.name}] ${e.message}`, { stack: e.stack });
        throw e;
      });
  }

  private generateMessage(key: string) {
    return {
      key: `key-${key}`,
      value: `value-${key}-${new Date().toISOString()}`
    };
  }

  private generateMessages(messageCount: number, key: string) {
    return Array(messageCount).fill(this.generateMessage(key));
  }
}

export class KafkaConsumer extends KafkaClient {
  private kafkaConsumer: Consumer;

  constructor(bootstrapServer: string, consumerGroup: string, username: string, password: string) {
    super(bootstrapServer, username, password);
    this.kafkaConsumer = this.kafka.consumer({ groupId: consumerGroup });
  }

  public async consumeMessages(topic: string, expectedMsgCount: number, fromBeginning = true): Promise<number> {
    let msgCount = 0;

    return new Promise((resolve, reject) => {
      this.kafkaConsumer.on('consumer.crash', async (error) => {
        this.shutdown();
        reject(error);
      });

      this.kafkaConsumer
        .connect()
        .then(() => {
          this.kafkaConsumer.subscribe({ topic: topic, fromBeginning: fromBeginning });
        })
        .then(() => {
          this.kafkaConsumer.run({
            eachMessage: async (messagePayload: EachMessagePayload) => {
              const { topic, partition, message } = messagePayload;
              const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
              console.log(`- ${prefix} ${message.key}#${message.value} -> ${msgCount}`);
              msgCount++;
              if (msgCount == expectedMsgCount) {
                console.log('Received: ' + msgCount);
                this.shutdown();
                resolve(msgCount);
              }
            }
          });
        });
    });
  }

  public async shutdown(): Promise<void> {
    await this.kafkaConsumer.disconnect();
  }
}
