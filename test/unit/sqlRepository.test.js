import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { SqlReviewRepository } from "../../src/infrastructure/persistence/SqlReviewRepository.js";
import { aReview } from "../helpers/fakes.js";

/** Pool falso do mssql: registra parâmetros e SQL e devolve o resultado programado. */
function fakePool(results = []) {
  const calls = [];
  return {
    calls,
    request() {
      const call = { inputs: {}, sql: "" };
      const req = {
        input(name, type, value) {
          call.inputs[name] = value;
          return req;
        },
        async query(sqlText) {
          call.sql = sqlText.replace(/\s+/g, " ").trim();
          calls.push(call);
          return results.shift() ?? { recordset: [], rowsAffected: [0] };
        }
      };
      return req;
    }
  };
}

const row = { Id: "a", MovieId: "m1", Author: "Ana", Rating: 9, Comment: null, CreatedAt: new Date("2026-11-08T12:00:00Z"), UpdatedAt: new Date("2026-11-08T12:00:00Z") };

describe("SqlReviewRepository (com pool falso)", () => {
  test("ensureSchema cria a tabela só se não existir", async () => {
    const pool = fakePool();
    await new SqlReviewRepository(pool).ensureSchema();
    assert.match(pool.calls[0].sql, /IF OBJECT_ID\(N'dbo\.Reviews', N'U'\) IS NULL/);
    assert.match(pool.calls[0].sql, /CHECK \(Rating BETWEEN 0 AND 10\)/);
  });

  test("save usa MERGE parametrizado (sem concatenar valores no SQL)", async () => {
    const pool = fakePool();
    await new SqlReviewRepository(pool).save(aReview({ id: "x", comment: "O'Brien" }));
    const call = pool.calls[0];
    assert.match(call.sql, /^MERGE dbo\.Reviews/);
    assert.equal(call.inputs.comment, "O'Brien");
    assert.ok(!call.sql.includes("O'Brien"));
  });

  test("findAll filtra por filme e mapeia linhas para entidades", async () => {
    const pool = fakePool([{ recordset: [row] }]);
    const reviews = await new SqlReviewRepository(pool).findAll({ movieId: "m1" });
    assert.equal(pool.calls[0].inputs.movieId, "m1");
    assert.equal(reviews[0].author, "Ana");
    assert.equal(reviews[0].createdAt.toISOString(), "2026-11-08T12:00:00.000Z");
  });

  test("statsByMovie arredonda a média e trata filme sem avaliações", async () => {
    const pool = fakePool([{ recordset: [{ Count: 3, Average: 8.3333 }] }, { recordset: [{ Count: 0, Average: null }] }]);
    const repo = new SqlReviewRepository(pool);
    assert.deepEqual(await repo.statsByMovie("m1"), { movieId: "m1", average: 8.3, count: 3 });
    assert.deepEqual(await repo.statsByMovie("m2"), { movieId: "m2", average: null, count: 0 });
  });

  test("delete devolve true/false conforme rowsAffected", async () => {
    const pool = fakePool([{ rowsAffected: [1] }, { rowsAffected: [0] }]);
    const repo = new SqlReviewRepository(pool);
    assert.equal(await repo.delete("a"), true);
    assert.equal(await repo.delete("a"), false);
  });
});
