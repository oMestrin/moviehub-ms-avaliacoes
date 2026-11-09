import { defineInterface } from "../../shared/kernel/defineInterface.js";

/**
 * Porta de saída (Application) — persistência de avaliações.
 * Implementações: SqlReviewRepository (Azure SQL) e InMemoryReviewRepository.
 *
 * findAll({ movieId? })   -> Promise<Review[]>  (mais recentes primeiro)
 * findById(id)            -> Promise<Review | null>
 * save(review)            -> Promise<void>      (insere ou atualiza)
 * delete(id)              -> Promise<boolean>
 * statsByMovie(movieId)   -> Promise<{ movieId, average: number|null, count }>
 * statsForAllMovies()     -> Promise<{ movieId, average, count }[]>
 */
export const ReviewRepository = defineInterface("ReviewRepository", [
  "findAll",
  "findById",
  "save",
  "delete",
  "statsByMovie",
  "statsForAllMovies"
]);
