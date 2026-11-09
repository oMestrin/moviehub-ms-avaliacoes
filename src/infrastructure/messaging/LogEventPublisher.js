import { toCloudEvent } from "./cloudEvent.js";

/** Infraestrutura — usado quando não há fila configurada: só registra o evento no log. */
export class LogEventPublisher {
  #logger;

  constructor(logger) {
    this.#logger = logger;
  }

  async publish(event) {
    this.#logger.info(`evento (sem fila configurada): ${JSON.stringify(toCloudEvent(event))}`);
  }
}
