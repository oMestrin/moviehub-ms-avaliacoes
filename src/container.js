import { createApp } from "./api/createApp.js";
import { openapi } from "./api/openapi.js";
import { CreateReviewUseCase } from "./features/create-review/CreateReviewUseCase.js";
import { createReviewEndpoint } from "./features/create-review/createReview.endpoint.js";
import { DeleteReviewUseCase } from "./features/delete-review/DeleteReviewUseCase.js";
import { deleteReviewEndpoint } from "./features/delete-review/deleteReview.endpoint.js";
import { GetMovieStatsUseCase } from "./features/get-movie-stats/GetMovieStatsUseCase.js";
import { getMovieStatsEndpoint } from "./features/get-movie-stats/getMovieStats.endpoint.js";
import { GetReviewUseCase } from "./features/get-review/GetReviewUseCase.js";
import { getReviewEndpoint } from "./features/get-review/getReview.endpoint.js";
import { ListMovieStatsUseCase } from "./features/list-movie-stats/ListMovieStatsUseCase.js";
import { listMovieStatsEndpoint } from "./features/list-movie-stats/listMovieStats.endpoint.js";
import { ListReviewsUseCase } from "./features/list-reviews/ListReviewsUseCase.js";
import { listReviewsEndpoint } from "./features/list-reviews/listReviews.endpoint.js";
import { UpdateReviewUseCase } from "./features/update-review/UpdateReviewUseCase.js";
import { updateReviewEndpoint } from "./features/update-review/updateReview.endpoint.js";
import { RandomIdGenerator } from "./infrastructure/system/RandomIdGenerator.js";
import { SystemClock } from "./infrastructure/system/SystemClock.js";

/**
 * Composition root: liga infraestrutura -> casos de uso -> endpoints.
 * Nova funcionalidade = nova pasta em features/ + uma linha na lista abaixo.
 */
export function buildApp({ reviewRepository, eventPublisher, idGenerator = new RandomIdGenerator(), clock = new SystemClock(), logger }) {
  const deps = { reviewRepository, eventPublisher, idGenerator, clock };

  const endpoints = [
    listReviewsEndpoint({ useCase: new ListReviewsUseCase(deps) }),
    getReviewEndpoint({ useCase: new GetReviewUseCase(deps) }),
    createReviewEndpoint({ useCase: new CreateReviewUseCase(deps) }),
    updateReviewEndpoint({ useCase: new UpdateReviewUseCase(deps) }),
    deleteReviewEndpoint({ useCase: new DeleteReviewUseCase(deps) }),
    listMovieStatsEndpoint({ useCase: new ListMovieStatsUseCase(deps) }),
    getMovieStatsEndpoint({ useCase: new GetMovieStatsUseCase(deps) })
  ];

  return createApp({
    endpoints,
    openapi,
    serviceName: "ms-avaliacoes",
    healthCheck: () => reviewRepository.ping(),
    logger
  });
}
