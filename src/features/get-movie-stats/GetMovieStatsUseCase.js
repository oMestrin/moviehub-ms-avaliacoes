import { ReviewRepository } from "../../application/ports/ReviewRepository.js";
import { ValidationError } from "../../domain/errors/index.js";

/** Caso de uso: média e quantidade de avaliações de um filme (usado pela Azure Function). */
export class GetMovieStatsUseCase {
  #reviews;

  constructor({ reviewRepository }) {
    this.#reviews = ReviewRepository.ensure(reviewRepository);
  }

  async execute({ movieId }) {
    if (typeof movieId !== "string" || movieId.trim() === "") {
      throw new ValidationError("movieId é obrigatório.");
    }
    return this.#reviews.statsByMovie(movieId.trim());
  }
}
