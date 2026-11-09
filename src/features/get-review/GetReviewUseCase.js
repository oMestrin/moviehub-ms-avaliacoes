import { ReviewRepository } from "../../application/ports/ReviewRepository.js";
import { NotFoundError } from "../../domain/errors/index.js";

/** Caso de uso: buscar uma avaliação pelo id. */
export class GetReviewUseCase {
  #reviews;

  constructor({ reviewRepository }) {
    this.#reviews = ReviewRepository.ensure(reviewRepository);
  }

  async execute({ id }) {
    const review = await this.#reviews.findById(id);
    if (!review) {
      throw new NotFoundError(`Avaliação ${id} não encontrada.`);
    }
    return review;
  }
}
