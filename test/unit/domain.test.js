import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Review } from "../../src/domain/Review.js";
import { ReviewEventType, reviewEvent } from "../../src/domain/ReviewEvents.js";
import { ValidationError } from "../../src/domain/errors/index.js";
import { NOW, aReview, validInput } from "../helpers/fakes.js";

describe("Review (entidade)", () => {
  test("cria uma avaliação válida e normaliza comentário vazio para null", () => {
    const review = aReview({ comment: "   " });
    assert.equal(review.rating, 9);
    assert.equal(review.comment, null);
  });

  for (const [field, value] of [["rating", 11], ["rating", 7.5], ["rating", "9"], ["author", ""], ["movieId", null]]) {
    test(`rejeita ${field} = ${JSON.stringify(value)}`, () => {
      assert.throws(() => Review.create({ ...validInput, [field]: value }, { id: "x", now: NOW }), ValidationError);
    });
  }

  test("update só altera nota e comentário", () => {
    const later = new Date("2026-11-09T00:00:00Z");
    const updated = aReview().update({ rating: 5, comment: "Mudei de ideia" }, later);
    assert.equal(updated.rating, 5);
    assert.equal(updated.author, "Leandro");
    assert.equal(updated.movieId, validInput.movieId);
    assert.equal(updated.updatedAt.toISOString(), later.toISOString());
  });
});

describe("eventos de domínio", () => {
  test("reviewEvent monta tipo, assunto e dados do fato", () => {
    const event = reviewEvent(ReviewEventType.REGISTERED, aReview({ id: "r-9" }), NOW);
    assert.deepEqual(event, {
      type: "moviehub.avaliacao.registrada",
      occurredAt: NOW,
      subject: `movies/${validInput.movieId}`,
      data: { reviewId: "r-9", movieId: validInput.movieId, rating: 9 }
    });
  });

  test("tipo desconhecido é recusado", () => {
    assert.throws(() => reviewEvent("outro", aReview(), NOW), TypeError);
  });
});
