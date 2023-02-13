//Singleton class for global storing created instances, serviceaccounts etc...
export class ResourceStore {
  private kafkaList: string[];
  private serviceAccountList: string[];
  private serviceRegistryList: string[];

  constructor() {
    this.kafkaList = [];
    this.serviceAccountList = [];
    this.serviceRegistryList = [];
  }

  get getKafkaList(): string[] {
    return this.kafkaList;
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

  clearServiceAccountList() {
    this.serviceAccountList = [];
  }

  clearServiceRegistryList() {
    this.serviceRegistryList = [];
  }
}

export const resourceStore = new ResourceStore();
