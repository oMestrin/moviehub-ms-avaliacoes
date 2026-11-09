import { toReviewResponse } from "../../api/reviewResponse.js";

/** API — GET /reviews?movieId= */
export function listReviewsEndpoint({ useCase }) {
  return {
    method: "get",
    path: "/reviews",
    async handler(req, res) {
      const reviews = await useCase.execute({ movieId: req.query.movieId });
      res.json(reviews.map(toReviewResponse));
    }
  };
}
