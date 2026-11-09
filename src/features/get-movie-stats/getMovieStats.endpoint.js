/** API — GET /movie-stats/:movieId */
export function getMovieStatsEndpoint({ useCase }) {
  return {
    method: "get",
    path: "/movie-stats/:movieId",
    async handler(req, res) {
      res.json(await useCase.execute({ movieId: req.params.movieId }));
    }
  };
}
