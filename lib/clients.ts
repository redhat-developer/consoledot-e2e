import { Consumer, Producer, Kafka, EachMessagePayload, logLevel } from 'kafkajs';

class KafkaClient {
    clientId: string;
    bootstrapServer: string;
    kafka: Kafka;

    constructor(clientId: string, bootstrapServer: string) {
        this.clientId = clientId
        this.bootstrapServer = bootstrapServer
        this.kafka = new Kafka({
            brokers: [bootstrapServer],
            clientId: clientId,
            ssl: true,
            sasl: {
                mechanism: 'plain',
                username: '48b75664-b3d6-4e13-a5ef-0d10d0e1a536',
                password: '0tG5Nb0ku8IzEduh1yKZ3SuyZ2iQrsfW',
            },
            logLevel: logLevel.INFO
          })
    }
}

export class KafkaProducer extends KafkaClient {
    
    private producer: Producer

    constructor(clientId: string, bootstrapServer: string) {
        super(clientId, bootstrapServer)
        this.producer = this.kafka.producer()
    }

    async produceMessages(topicName: string, messageCount: number, key: string) {
        await this.producer.connect()
        
        const messages = this.generateMessages(messageCount, key)
        return await this.producer
            .send({
                topic: topicName,
                messages: messages,
                acks: -1,
            })
            .then(response => {
                this.kafka.logger().info(`Messages sent #${response}`, {
                response,
                messageCount,
                })
                return true  
            })
            .catch(e => {
                this.kafka.logger().error(`[${KafkaProducer.name}] ${e.message}`, { stack: e.stack })
                return false
            })
    }

    private generateMessage(key: String) {
        return {
            key: `key-${key}`,
            value: `value-${key}-${new Date().toISOString()}`,
        }
    }

    private generateMessages(messageCount: number, key: string) {
        return Array(messageCount)
            .fill(this.generateMessage(key))
    }
}

export class KafkaConsumer extends KafkaClient {

    private kafkaConsumer: Consumer

    constructor(clientId: string, bootstrapServer: string, consumerGroup: string) {
        super(clientId, bootstrapServer)
        this.kafkaConsumer = this.kafka.consumer({ groupId: consumerGroup })
    }


    public async consumeMessages(topic: string, consumerGroup: string, messageCount: number, fromBeginning: boolean = true) {   
    let msgCount = 1;
    let test

        try {
            await this.kafkaConsumer.connect()
            await this.kafkaConsumer.subscribe({ topic: topic, fromBeginning: fromBeginning })
        
            await this.kafkaConsumer.run({
                eachMessage: async (messagePayload: EachMessagePayload) => {
                    const { topic, partition, message } = messagePayload
                    const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`
                    console.log(`- ${prefix} ${message.key}#${message.value} -> ${msgCount}`)
                    msgCount++
                    if (msgCount >= messageCount) {
                        test = Promise.resolve(msgCount) 
                    }
                }
            })
        } catch (error) {
            console.log('Error: ', error)
            return false
        }

        const timeout = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(false);
            }, 40000);
          });

        const succeeded = new Promise((resolve, _) => {
            if (msgCount >= messageCount) {
                console.log(msgCount)
                resolve(true)
            }
        })

        return Promise.race([test, timeout])

        // return await new Promise((resolve, _) => {
        //     setTimeout(() => {
        //         if (msgCount <= messageCount) {
        //             console.log(msgCount)
        //             resolve(true)
        //         } 
        //     }, 20000)
        // }) 
    }
    
    public async shutdown(): Promise<void> {
        await this.kafkaConsumer.disconnect()
    }
}

