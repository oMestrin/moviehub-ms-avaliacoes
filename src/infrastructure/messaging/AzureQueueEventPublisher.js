import { QueueClient } from "@azure/storage-queue";
import { toCloudEvent } from "./cloudEvent.js";

/**
 * Infraestrutura — publica eventos numa fila do Azure Storage.
 * A Azure Function (gatilho de fila) consome essa fila. A mensagem vai em
 * Base64, que é a codificação padrão esperada pelo gatilho de fila.
 */
export class AzureQueueEventPublisher {
  #queue;

  /** @param {QueueClient} queueClient */
  constructor(queueClient) {
    this.#queue = queueClient;
  }

  static fromConnectionString(connectionString, queueName) {
    return new AzureQueueEventPublisher(new QueueClient(connectionString, queueName));
  }

  async ensureQueue() {
    await this.#queue.createIfNotExists();
  }

  async publish(event) {
    const message = Buffer.from(JSON.stringify(toCloudEvent(event)), "utf8").toString("base64");
    await this.#queue.sendMessage(message);
  }
}
