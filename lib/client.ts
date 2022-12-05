import { expect } from '@playwright/test';
import { Kafka } from 'kafkajs';

const messageContent = 'first_message';

export const produceAndConsumeMessage = async function (
  broker: string,
  credentials: { clientID: string; clientSecret: string },
  topic: string
) {
  const kafka = new Kafka({
    brokers: [broker],
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: credentials.clientID,
      password: credentials.clientSecret
    }
  });

  const producer = kafka.producer();

  await producer.connect();
  await producer.send({
    topic: topic,
    messages: [{ value: messageContent }]
  });

  await producer.disconnect();

  const consumer = kafka.consumer({ groupId: 'test-group' });

  await consumer.connect();
  await consumer.subscribe({ topic: topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      await expect(message.value.toString()).toContain(messageContent);
      console.log({
        value: message.value.toString()
      });
    }
  });
};
