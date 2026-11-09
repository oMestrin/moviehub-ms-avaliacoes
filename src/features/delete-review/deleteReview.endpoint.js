/** API — DELETE /reviews/:id */
export function deleteReviewEndpoint({ useCase }) {
  return {
    method: "delete",
    path: "/reviews/:id",
    async handler(req, res) {
      await useCase.execute({ id: req.params.id });
      res.status(204).end();
    }
  };
}
