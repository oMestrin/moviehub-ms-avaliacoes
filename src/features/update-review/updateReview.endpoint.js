import { toReviewResponse } from "../../api/reviewResponse.js";

/** API — PUT /reviews/:id  { rating, comment } */
export function updateReviewEndpoint({ useCase }) {
  return {
    method: "put",
    path: "/reviews/:id",
    async handler(req, res) {
      const { rating, comment } = req.body ?? {};
      res.json(toReviewResponse(await useCase.execute({ id: req.params.id, rating, comment })));
    }
  };
}
