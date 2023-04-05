//Singleton class for global storing created instances, serviceaccounts etc...
export class ResourceStore {
  private kafkaList: string[];
  private kafkaTopicList: string[];
  private serviceAccountList: string[];
  private serviceRegistryList: string[];

  constructor() {
    this.kafkaList = [];
    this.kafkaTopicList = [];
    this.serviceAccountList = [];
    this.serviceRegistryList = [];
  }

  get getKafkaList(): string[] {
    return this.kafkaList;
  }
  get getKafkaTopicList(): string[] {
    return this.kafkaTopicList;
  }

  get getSeviceAccountList(): string[] {
    return this.serviceAccountList;
  }

  get getServiceRegistryList(): string[] {
    return this.serviceRegistryList;
  }

  addKafka(kafka: string) {
    this.kafkaList.push(kafka);
  }

  addKafkaTopic(topic: string) {
    this.kafkaTopicList.push(topic);
  }

  addServiceAccount(sa: string) {
    this.serviceAccountList.push(sa);
  }

  addServiceRegistry(serviceRegistry: string) {
    this.serviceRegistryList.push(serviceRegistry);
  }

  removeKafka(kafka: string) {
    this.kafkaList = this.kafkaList.filter(function (element) {
      return element != kafka;
    });
  }

  removeKafkaTopic(topic: string) {
    this.kafkaTopicList = this.kafkaTopicList.filter(function (element) {
      return element != topic;
    });
  }

  removeServiceAccount(sa: string) {
    this.serviceAccountList = this.serviceAccountList.filter(function (element) {
      return element != sa;
    });
  }

  removeServiceRegistry(serviceRegistry: string) {
    this.serviceRegistryList = this.serviceRegistryList.filter(function (element) {
      return element != serviceRegistry;
    });
  }

  clearKafkaList() {
    this.kafkaList = [];
  }

  clearKafkaTopicList() {
    this.kafkaTopicList = [];
  }

  clearServiceAccountList() {
    this.serviceAccountList = [];
  }

  clearServiceRegistryList() {
    this.serviceRegistryList = [];
  }
}

export const resourceStore = new ResourceStore();
