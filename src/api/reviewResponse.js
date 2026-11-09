/** API — formato de saída (DTO) de uma avaliação. */
export function toReviewResponse(review) {
  return {
    id: review.id,
    movieId: review.movieId,
    author: review.author,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  };
}
