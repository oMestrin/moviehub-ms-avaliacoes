import { ReviewRepository } from "../../application/ports/ReviewRepository.js";

/** Caso de uso: média e quantidade de avaliações de todos os filmes avaliados (usado pelo BFF). */
export class ListMovieStatsUseCase {
  #reviews;

  constructor({ reviewRepository }) {
    this.#reviews = ReviewRepository.ensure(reviewRepository);
  }

  async execute() {
    return this.#reviews.statsForAllMovies();
  }
}
