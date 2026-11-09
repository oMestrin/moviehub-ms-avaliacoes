import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { CreateReviewUseCase } from "../../src/features/create-review/CreateReviewUseCase.js";
import { DeleteReviewUseCase } from "../../src/features/delete-review/DeleteReviewUseCase.js";
import { GetMovieStatsUseCase } from "../../src/features/get-movie-stats/GetMovieStatsUseCase.js";
import { GetReviewUseCase } from "../../src/features/get-review/GetReviewUseCase.js";
import { ListMovieStatsUseCase } from "../../src/features/list-movie-stats/ListMovieStatsUseCase.js";
import { ListReviewsUseCase } from "../../src/features/list-reviews/ListReviewsUseCase.js";
import { UpdateReviewUseCase } from "../../src/features/update-review/UpdateReviewUseCase.js";
import { NotFoundError, ValidationError } from "../../src/domain/errors/index.js";
import { InMemoryReviewRepository } from "../../src/infrastructure/persistence/InMemoryReviewRepository.js";
import { MOVIE, aReview, fixedClock, recordingPublisher, sequenceIds, validInput } from "../helpers/fakes.js";

const setup = (reviews = []) => ({
  reviewRepository: new InMemoryReviewRepository(reviews),
  eventPublisher: recordingPublisher(),
  idGenerator: sequenceIds(),
  clock: fixedClock()
});

describe("casos de uso de avaliações", () => {
  test("recusam dependências que não cumprem as portas", () => {
    assert.throws(() => new CreateReviewUseCase({ ...setup(), eventPublisher: {} }), /EventPublisher/);
    assert.throws(() => new ListReviewsUseCase({ reviewRepository: { findAll() {} } }), /ReviewRepository/);
  });

  test("CreateReview salva e publica moviehub.avaliacao.registrada", async () => {
    const deps = setup();
    const review = await new CreateReviewUseCase(deps).execute(validInput);
    assert.equal(review.id, "r-1");
    assert.ok(await deps.reviewRepository.findById("r-1"));
    assert.deepEqual(deps.eventPublisher.events.map((e) => [e.type, e.data.movieId]), [["moviehub.avaliacao.registrada", MOVIE]]);
  });

  test("CreateReview inválida não salva nem publica", async () => {
    const deps = setup();
    await assert.rejects(new CreateReviewUseCase(deps).execute({ ...validInput, rating: 20 }), ValidationError);
    assert.equal(await deps.reviewRepository.count(), 0);
    assert.equal(deps.eventPublisher.events.length, 0);
  });

  test("UpdateReview altera e publica moviehub.avaliacao.atualizada", async () => {
    const deps = setup([aReview({ id: "a" })]);
    const updated = await new UpdateReviewUseCase(deps).execute({ id: "a", rating: 4, comment: null });
    assert.equal(updated.rating, 4);
    assert.equal(deps.eventPublisher.events[0].type, "moviehub.avaliacao.atualizada");
    await assert.rejects(new UpdateReviewUseCase(deps).execute({ id: "x", rating: 4 }), NotFoundError);
  });

  test("DeleteReview remove e publica moviehub.avaliacao.removida com o filme da avaliação", async () => {
    const deps = setup([aReview({ id: "a" })]);
    await new DeleteReviewUseCase(deps).execute({ id: "a" });
    assert.equal(await deps.reviewRepository.findById("a"), null);
    assert.deepEqual(deps.eventPublisher.events.map((e) => [e.type, e.data.movieId]), [["moviehub.avaliacao.removida", MOVIE]]);
    await assert.rejects(new DeleteReviewUseCase(deps).execute({ id: "a" }), NotFoundError);
  });

  test("ListReviews filtra por filme e GetReview acha pelo id", async () => {
    const deps = setup([aReview({ id: "a" }), aReview({ id: "b", movieId: "outro" })]);
    assert.deepEqual((await new ListReviewsUseCase(deps).execute({ movieId: MOVIE })).map((r) => r.id), ["a"]);
    assert.equal((await new GetReviewUseCase(deps).execute({ id: "b" })).movieId, "outro");
  });

  test("estatísticas: média com 1 casa e contagem; filme sem avaliações tem média null", async () => {
    const deps = setup([aReview({ id: "a", rating: 9 }), aReview({ id: "b", rating: 8 }), aReview({ id: "c", rating: 8 }), aReview({ id: "d", movieId: "m2", rating: 5 })]);
    assert.deepEqual(await new GetMovieStatsUseCase(deps).execute({ movieId: MOVIE }), { movieId: MOVIE, average: 8.3, count: 3 });
    assert.deepEqual(await new GetMovieStatsUseCase(deps).execute({ movieId: "sem" }), { movieId: "sem", average: null, count: 0 });
    assert.equal((await new ListMovieStatsUseCase(deps).execute()).length, 2);
  });
});
