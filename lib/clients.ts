import { Consumer, Producer, Kafka, EachMessagePayload, logLevel } from 'kafkajs';

class KafkaClient {
  bootstrapServer: string;
  username: string;
  password: string;
  kafka: Kafka;

  constructor(bootstrapServer: string, username: string, password: string) {
    this.bootstrapServer = bootstrapServer;
    this.username = username;
    this.password = password;
    this.kafka = new Kafka({
      brokers: [bootstrapServer],
      ssl: true,
      sasl: {
        // TODO add oauth
        mechanism: 'plain',
        username: username,
        password: password
      },
      logLevel: logLevel.INFO
    });
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
        return e;
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

  public async consumeMessages(topic: string, expectedMsgCount: number, fromBeginning = true): Promise<boolean> {
    let msgCount = 0;

    try {
      await this.kafkaConsumer.connect();
      await this.kafkaConsumer.subscribe({ topic: topic, fromBeginning: fromBeginning });

      await this.kafkaConsumer.run({
        eachMessage: async (messagePayload: EachMessagePayload) => {
          const { topic, partition, message } = messagePayload;
          const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
          console.log(`- ${prefix} ${message.key}#${message.value} -> ${msgCount}`);
          msgCount++;
        }
      });
    } catch (error) {
      console.log('Error: ', error);
      return error;
    }

    return await new Promise((resolve, reject) => {
      setTimeout(() => {
        if (msgCount <= expectedMsgCount) {
          console.log('Received: ' + msgCount);
          resolve(true);
        } else {
          reject(false);
        }
      }, 20000);
    });
  }

  public async shutdown(): Promise<void> {
    await this.kafkaConsumer.disconnect();
  }
}
