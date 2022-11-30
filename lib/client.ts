import { Kafka } from 'kafkajs';

export const produceAndConsumeMessage = async function (
  broker: string,
  credentials: { clientID: string; clientSecret: string },
  topic: string
) {
  const kafka = new Kafka({
    brokers: [broker],
    // authenticationTimeout: 10000,
    // reauthenticationThreshold: 10000,
    ssl: true,
    sasl: {
      mechanism: 'plain', // scram-sha-256 or scram-sha-512
      username: credentials.clientID,
      password: credentials.clientSecret
    }
  });

  const producer = kafka.producer();

  await producer.connect();
  await producer.send({
    topic: topic,
    messages: [{ value: 'first_message' }]
  });

  await producer.disconnect();

  const consumer = kafka.consumer({ groupId: 'test-group' });

  await consumer.connect();
  await consumer.subscribe({ topic: topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log({
        value: message.value.toString()
      });
    }
  });
};
