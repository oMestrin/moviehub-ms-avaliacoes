/** API — GET /movie-stats */
export function listMovieStatsEndpoint({ useCase }) {
  return {
    method: "get",
    path: "/movie-stats",
    async handler(req, res) {
      res.json(await useCase.execute());
    }
  };
}
