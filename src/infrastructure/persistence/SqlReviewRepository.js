import sql from "mssql";
import { Review } from "../../domain/Review.js";
import { roundAverage } from "./statsMath.js";

/**
 * Infraestrutura — repositório de avaliações no Azure SQL Database.
 * Implementa a porta ReviewRepository. Único arquivo que conhece SQL.
 */
export class SqlReviewRepository {
  #pool;

  /** @param {import("mssql").ConnectionPool} pool conexão já aberta */
  constructor(pool) {
    this.#pool = pool;
  }

  /** Cria a tabela e o índice na primeira execução (idempotente). */
  async ensureSchema() {
    await this.#pool.request().query(`
      IF OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Reviews (
          Id        NVARCHAR(64)   NOT NULL CONSTRAINT PK_Reviews PRIMARY KEY,
          MovieId   NVARCHAR(64)   NOT NULL,
          Author    NVARCHAR(80)   NOT NULL,
          Rating    TINYINT        NOT NULL CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 0 AND 10),
          Comment   NVARCHAR(1000) NULL,
          CreatedAt DATETIME2(3)   NOT NULL,
          UpdatedAt DATETIME2(3)   NOT NULL
        );
        CREATE INDEX IX_Reviews_MovieId ON dbo.Reviews (MovieId);
      END`);
  }

  async findAll({ movieId } = {}) {
    const request = this.#pool.request().input("movieId", sql.NVarChar(64), movieId ?? null);
    const result = await request.query(
      `SELECT Id, MovieId, Author, Rating, Comment, CreatedAt, UpdatedAt
         FROM dbo.Reviews
        WHERE (@movieId IS NULL OR MovieId = @movieId)
        ORDER BY CreatedAt DESC`
    );
    return result.recordset.map(toReview);
  }

  async findById(id) {
    const result = await this.#pool
      .request()
      .input("id", sql.NVarChar(64), id)
      .query("SELECT Id, MovieId, Author, Rating, Comment, CreatedAt, UpdatedAt FROM dbo.Reviews WHERE Id = @id");
    return result.recordset[0] ? toReview(result.recordset[0]) : null;
  }

  async save(review) {
    const r = review.toSnapshot();
    await this.#pool
      .request()
      .input("id", sql.NVarChar(64), r.id)
      .input("movieId", sql.NVarChar(64), r.movieId)
      .input("author", sql.NVarChar(80), r.author)
      .input("rating", sql.TinyInt, r.rating)
      .input("comment", sql.NVarChar(1000), r.comment)
      .input("createdAt", sql.DateTime2(3), r.createdAt)
      .input("updatedAt", sql.DateTime2(3), r.updatedAt)
      .query(`
        MERGE dbo.Reviews AS target
        USING (SELECT @id AS Id) AS source ON target.Id = source.Id
        WHEN MATCHED THEN
          UPDATE SET Rating = @rating, Comment = @comment, UpdatedAt = @updatedAt
        WHEN NOT MATCHED THEN
          INSERT (Id, MovieId, Author, Rating, Comment, CreatedAt, UpdatedAt)
          VALUES (@id, @movieId, @author, @rating, @comment, @createdAt, @updatedAt);`);
  }

  async delete(id) {
    const result = await this.#pool.request().input("id", sql.NVarChar(64), id).query("DELETE FROM dbo.Reviews WHERE Id = @id");
    return result.rowsAffected[0] > 0;
  }

  async statsByMovie(movieId) {
    const result = await this.#pool
      .request()
      .input("movieId", sql.NVarChar(64), movieId)
      .query("SELECT COUNT(*) AS Count, AVG(CAST(Rating AS FLOAT)) AS Average FROM dbo.Reviews WHERE MovieId = @movieId");
    const { Count, Average } = result.recordset[0];
    return { movieId, average: roundAverage(Average, Count), count: Count };
  }

  async statsForAllMovies() {
    const result = await this.#pool
      .request()
      .query("SELECT MovieId, COUNT(*) AS Count, AVG(CAST(Rating AS FLOAT)) AS Average FROM dbo.Reviews GROUP BY MovieId");
    return result.recordset.map((row) => ({ movieId: row.MovieId, average: roundAverage(row.Average, row.Count), count: row.Count }));
  }

  async count() {
    const result = await this.#pool.request().query("SELECT COUNT(*) AS Count FROM dbo.Reviews");
    return result.recordset[0].Count;
  }

  async ping() {
    await this.#pool.request().query("SELECT 1 AS ok");
    return { database: "azure-sql" };
  }
}

function toReview(row) {
  return Review.restore({
    id: row.Id,
    movieId: row.MovieId,
    author: row.Author,
    rating: row.Rating,
    comment: row.Comment,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  });
}
