/**
 * Eventos de domínio publicados pelo microsserviço de avaliações.
 * O envelope CloudEvents (id, source, specversion) é montado pela
 * infraestrutura de mensageria; aqui ficam só o tipo e os dados do fato.
 */
export const ReviewEventType = Object.freeze({
  REGISTERED: "moviehub.avaliacao.registrada",
  UPDATED: "moviehub.avaliacao.atualizada",
  REMOVED: "moviehub.avaliacao.removida"
});

export function reviewEvent(type, review, occurredAt) {
  if (!Object.values(ReviewEventType).includes(type)) {
    throw new TypeError(`Tipo de evento desconhecido: ${type}`);
  }
  return Object.freeze({
    type,
    occurredAt,
    subject: `movies/${review.movieId}`,
    data: Object.freeze({ reviewId: review.id, movieId: review.movieId, rating: review.rating })
  });
}
