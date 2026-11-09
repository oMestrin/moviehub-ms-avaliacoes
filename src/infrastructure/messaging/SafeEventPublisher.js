/**
 * Infraestrutura — decorator que não deixa uma falha na fila desfazer a
 * operação já gravada no banco: registra o erro e segue. (Uma evolução seria
 * o padrão Transactional Outbox.)
 */
export class SafeEventPublisher {
  #inner;
  #logger;

  constructor(inner, logger) {
    this.#inner = inner;
    this.#logger = logger;
  }

  async publish(event) {
    try {
      await this.#inner.publish(event);
      this.#logger.info(`evento publicado: ${event.type} (${event.subject})`);
    } catch (error) {
      this.#logger.error(new Error(`falha ao publicar ${event.type}: ${error.message}`));
    }
  }
}
