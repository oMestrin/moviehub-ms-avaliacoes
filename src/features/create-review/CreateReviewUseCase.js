import { Clock } from "../../application/ports/Clock.js";
import { EventPublisher } from "../../application/ports/EventPublisher.js";
import { IdGenerator } from "../../application/ports/IdGenerator.js";
import { ReviewRepository } from "../../application/ports/ReviewRepository.js";
import { Review } from "../../domain/Review.js";
import { ReviewEventType, reviewEvent } from "../../domain/ReviewEvents.js";

/**
 * Caso de uso: registrar uma avaliação e publicar "moviehub.avaliacao.registrada".
 * O evento é consumido pela Azure Function, que recalcula a nota dos membros
 * no microsserviço de filmes (comunicação assíncrona entre serviços).
 */
export class CreateReviewUseCase {
  #reviews;
  #events;
  #ids;
  #clock;

  constructor({ reviewRepository, eventPublisher, idGenerator, clock }) {
    this.#reviews = ReviewRepository.ensure(reviewRepository);
    this.#events = EventPublisher.ensure(eventPublisher);
    this.#ids = IdGenerator.ensure(idGenerator);
    this.#clock = Clock.ensure(clock);
  }

  async execute(input) {
    const now = this.#clock.now();
    const review = Review.create(input, { id: this.#ids.next(), now });
    await this.#reviews.save(review);
    await this.#events.publish(reviewEvent(ReviewEventType.REGISTERED, review, now));
    return review;
  }
}
