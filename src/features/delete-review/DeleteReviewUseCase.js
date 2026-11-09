import { Clock } from "../../application/ports/Clock.js";
import { EventPublisher } from "../../application/ports/EventPublisher.js";
import { ReviewRepository } from "../../application/ports/ReviewRepository.js";
import { NotFoundError } from "../../domain/errors/index.js";
import { ReviewEventType, reviewEvent } from "../../domain/ReviewEvents.js";

/** Caso de uso: remover uma avaliação e publicar "moviehub.avaliacao.removida". */
export class DeleteReviewUseCase {
  #reviews;
  #events;
  #clock;

  constructor({ reviewRepository, eventPublisher, clock }) {
    this.#reviews = ReviewRepository.ensure(reviewRepository);
    this.#events = EventPublisher.ensure(eventPublisher);
    this.#clock = Clock.ensure(clock);
  }

  async execute({ id }) {
    const review = await this.#reviews.findById(id);
    if (!review) {
      throw new NotFoundError(`Avaliação ${id} não encontrada.`);
    }
    await this.#reviews.delete(id);
    await this.#events.publish(reviewEvent(ReviewEventType.REMOVED, review, this.#clock.now()));
  }
}
