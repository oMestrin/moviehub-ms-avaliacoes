import { Review } from "../../domain/Review.js";
import { reviewsSeed } from "./reviewsSeed.js";

/** Grava as avaliações de exemplo se o repositório estiver vazio (sem publicar eventos). */
export async function seedReviewsIfEmpty(repository, now = new Date()) {
  if ((await repository.count()) > 0) {
    return 0;
  }
  for (const item of reviewsSeed) {
    await repository.save(Review.restore({ ...item, createdAt: now, updatedAt: now }));
  }
  return reviewsSeed.length;
}
