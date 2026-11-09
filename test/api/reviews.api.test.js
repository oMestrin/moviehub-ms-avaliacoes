import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../../src/container.js";
import { InMemoryReviewRepository } from "../../src/infrastructure/persistence/InMemoryReviewRepository.js";
import { seedReviewsIfEmpty } from "../../src/infrastructure/persistence/seedReviews.js";
import { MOVIE, fixedClock, recordingPublisher, sequenceIds, validInput } from "../helpers/fakes.js";

let server;
let base;
const publisher = recordingPublisher();

before(async () => {
  const reviewRepository = new InMemoryReviewRepository();
  await seedReviewsIfEmpty(reviewRepository);
  server = buildApp({ reviewRepository, eventPublisher: publisher, idGenerator: sequenceIds("nova"), clock: fixedClock() }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const json = (method, body) => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

describe("API do microsserviço de avaliações", () => {
  test("GET /reviews?movieId lista as avaliações do filme", async () => {
    const reviews = await (await fetch(`${base}/reviews?movieId=${MOVIE}`)).json();
    assert.equal(reviews.length, 2);
    assert.ok(reviews.every((r) => r.movieId === MOVIE));
  });

  test("GET /movie-stats e /movie-stats/:movieId", async () => {
    const all = await (await fetch(`${base}/movie-stats`)).json();
    assert.equal(all.length, 5);
    assert.deepEqual(await (await fetch(`${base}/movie-stats/${MOVIE}`)).json(), { movieId: MOVIE, average: 9.5, count: 2 });
  });

  test("CRUD completo publica os três eventos", async () => {
    publisher.events.length = 0;
    const created = await fetch(`${base}/reviews`, json("POST", validInput));
    assert.equal(created.status, 201);
    const review = await created.json();
    assert.equal(review.id, "nova-1");

    assert.equal((await fetch(`${base}/reviews/${review.id}`)).status, 200);
    const updated = await (await fetch(`${base}/reviews/${review.id}`, json("PUT", { rating: 6, comment: "ok" }))).json();
    assert.equal(updated.rating, 6);
    assert.equal((await fetch(`${base}/reviews/${review.id}`, { method: "DELETE" })).status, 204);
    assert.equal((await fetch(`${base}/reviews/${review.id}`)).status, 404);

    assert.deepEqual(publisher.events.map((e) => e.type), [
      "moviehub.avaliacao.registrada",
      "moviehub.avaliacao.atualizada",
      "moviehub.avaliacao.removida"
    ]);
  });

  test("dados inválidos respondem 400", async () => {
    const res = await fetch(`${base}/reviews`, json("POST", { ...validInput, rating: 11 }));
    assert.equal(res.status, 400);
    assert.match((await res.json()).message, /rating/);
  });

  test("Swagger e health", async () => {
    const spec = await (await fetch(`${base}/openapi.json`)).json();
    assert.deepEqual(Object.keys(spec.paths).sort(), ["/health", "/movie-stats", "/movie-stats/{movieId}", "/reviews", "/reviews/{id}"]);
    assert.equal((await fetch(`${base}/docs/`)).status, 200);
    assert.equal((await (await fetch(`${base}/health`)).json()).status, "ok");
  });
});
