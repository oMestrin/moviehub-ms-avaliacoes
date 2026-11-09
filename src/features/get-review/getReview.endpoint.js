import { toReviewResponse } from "../../api/reviewResponse.js";

/** API — GET /reviews/:id */
export function getReviewEndpoint({ useCase }) {
  return {
    method: "get",
    path: "/reviews/:id",
    async handler(req, res) {
      res.json(toReviewResponse(await useCase.execute({ id: req.params.id })));
    }
  };
}
