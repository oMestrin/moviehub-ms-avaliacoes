import { Review } from "../../domain/Review.js";
import { roundAverage } from "./statsMath.js";

/** Infraestrutura — repositório em memória (testes e execução local sem Azure SQL). */
export class InMemoryReviewRepository {
  #items = new Map();

  constructor(reviews = []) {
    for (const review of reviews) {
      this.#items.set(review.id, review.toSnapshot());
    }
  }

  async findAll({ movieId } = {}) {
    return [...this.#items.values()]
      .filter((item) => !movieId || item.movieId === movieId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((item) => Review.restore(item));
  }

  async findById(id) {
    const item = this.#items.get(id);
    return item ? Review.restore(item) : null;
  }

  async save(review) {
    this.#items.set(review.id, review.toSnapshot());
  }

  async delete(id) {
    return this.#items.delete(id);
  }

  async statsByMovie(movieId) {
    const ratings = [...this.#items.values()].filter((item) => item.movieId === movieId).map((item) => item.rating);
    return stats(movieId, ratings);
  }

  async statsForAllMovies() {
    const byMovie = new Map();
    for (const item of this.#items.values()) {
      byMovie.set(item.movieId, [...(byMovie.get(item.movieId) ?? []), item.rating]);
    }
    return [...byMovie.entries()].map(([movieId, ratings]) => stats(movieId, ratings));
  }

  async count() {
    return this.#items.size;
  }

  async ping() {
    return { database: "in-memory" };
  }
}

function stats(movieId, ratings) {
  const count = ratings.length;
  const sum = ratings.reduce((a, b) => a + b, 0);
  return { movieId, average: roundAverage(count ? sum / count : null, count), count };
}
