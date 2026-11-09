import { ReviewRepository } from "../../application/ports/ReviewRepository.js";

/** Caso de uso: listar avaliações, opcionalmente de um filme. */
export class ListReviewsUseCase {
  #reviews;

  constructor({ reviewRepository }) {
    this.#reviews = ReviewRepository.ensure(reviewRepository);
  }

  async execute({ movieId } = {}) {
    const filter = typeof movieId === "string" && movieId.trim() !== "" ? { movieId: movieId.trim() } : {};
    return this.#reviews.findAll(filter);
  }
}
