import { Clock } from "../../application/ports/Clock.js";
import { EventPublisher } from "../../application/ports/EventPublisher.js";
import { ReviewRepository } from "../../application/ports/ReviewRepository.js";
import { NotFoundError } from "../../domain/errors/index.js";
import { ReviewEventType, reviewEvent } from "../../domain/ReviewEvents.js";

/** Caso de uso: alterar nota/comentário e publicar "moviehub.avaliacao.atualizada". */
export class UpdateReviewUseCase {
  #reviews;
  #events;
  #clock;

  constructor({ reviewRepository, eventPublisher, clock }) {
    this.#reviews = ReviewRepository.ensure(reviewRepository);
    this.#events = EventPublisher.ensure(eventPublisher);
    this.#clock = Clock.ensure(clock);
  }

  async execute({ id, rating, comment }) {
    const current = await this.#reviews.findById(id);
    if (!current) {
      throw new NotFoundError(`Avaliação ${id} não encontrada.`);
    }
    const now = this.#clock.now();
    const updated = current.update({ rating, comment }, now);
    await this.#reviews.save(updated);
    await this.#events.publish(reviewEvent(ReviewEventType.UPDATED, updated, now));
    return updated;
  }
}
