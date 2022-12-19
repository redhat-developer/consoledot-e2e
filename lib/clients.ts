import { Consumer, Producer, Kafka, EachMessagePayload, logLevel } from 'kafkajs';

enum Mechanism {
  plain = "plain",
  oauthbearer = "oauthbearer"
}

class KafkaClient {
  bootstrapServer: string;
  username: string;
  password: string;
  kafka: Kafka;

  constructor(bootstrapServer: string, username: string, password: string, oauthUrl: string = "") {
    this.bootstrapServer = bootstrapServer;
    this.username = username;
    this.password = password;
    if (oauthUrl == "") {
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
    // } 
    // else {
    //   this.kafka = new Kafka({
    //     brokers: [bootstrapServer],
    //     ssl: true,
    //     sasl: {
    //       mechanism: Mechanism.oauthbearer,
    //       oauthBearerProvider: async () => { 
    //         // https://stackoverflow.com/questions/61444952/generating-oauth-2-0-access-token-with-javascript
    //         const token = getToken()
    //           return {
    //             value: token
    //           }
    //       }
    //     },
    //     logLevel: logLevel.INFO
    //   });
    // }
    }
  }
}

// function oauthBearerProvider() {
//   let tokenPromise;

//   async function getToken() {
//     // Get token from OAuth endpoint
//   }

//   async function refreshToken() {
//     let response = await getToken();

//     const refreshDelay = (response.expires_in * 1000) - DEFAULT_REAUTH_THRESHOLD - OAUTH_TOKEN_RENEWAL_THRESHOLD;
//     setTimeout(() => {
//       tokenPromise = refreshToken();
//     }, refreshDelay);

//     return response.access_token;
//   }

//   tokenPromise = refreshToken();

//   return async function() {
//     return {
//       value: await tokenPromise
//     };
//   };
// }

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

  public async consumeMessages(topic: string, expectedMsgCount: number, fromBeginning = true): Promise<number> {
    let msgCount = 0;


    return new Promise((resolve, reject) => {
      try {
        this.kafkaConsumer.connect()
          .then(() => this.kafkaConsumer.subscribe({ topic: topic, fromBeginning: fromBeginning }))
          .then(() => this.kafkaConsumer.run({
              eachMessage: async (messagePayload: EachMessagePayload) => {
                const { topic, partition, message } = messagePayload;
                const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
                console.log(`- ${prefix} ${message.key}#${message.value} -> ${msgCount}`);
                msgCount++;
                if (msgCount == expectedMsgCount) {
                  console.log('Received: ' + msgCount);
                  resolve(msgCount);
                }
              }
            }));
      } catch (error) {
        console.log('Error: ', error);
        reject(error);
      }
    });

  }

  public async shutdown(): Promise<void> {
    await this.kafkaConsumer.disconnect();
  }
}
