import { ValidationError } from "./errors/index.js";

/**
 * Entidade de domínio — Avaliação de um filme feita por um membro.
 *
 * Camada mais interna: não conhece HTTP, SQL nem filas. O filme é referenciado
 * só pelo id (movieId): ele pertence a outro microsserviço e outro banco
 * (Database per Service), então não há chave estrangeira entre eles.
 */
export class Review {
  constructor({ id, movieId, author, rating, comment, createdAt, updatedAt }) {
    this.id = requireText(id, "id", 64);
    this.movieId = requireText(movieId, "movieId", 64);
    this.author = requireText(author, "author", 80);
    this.rating = requireRating(rating);
    this.comment = optionalText(comment, "comment", 1000);
    this.createdAt = toDate(createdAt, "createdAt");
    this.updatedAt = toDate(updatedAt ?? createdAt, "updatedAt");
    Object.freeze(this);
  }

  static create({ movieId, author, rating, comment }, { id, now }) {
    return new Review({ id, movieId, author, rating, comment, createdAt: now, updatedAt: now });
  }

  static restore(snapshot) {
    return new Review(snapshot);
  }

  /** Só nota e comentário podem mudar; o filme e o autor ficam fixos. */
  update({ rating, comment }, now) {
    return new Review({ ...this.toSnapshot(), rating, comment, updatedAt: now });
  }

  toSnapshot() {
    return {
      id: this.id,
      movieId: this.movieId,
      author: this.author,
      rating: this.rating,
      comment: this.comment,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

function requireText(value, field, max) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`Campo "${field}" é obrigatório.`);
  }
  if (value.trim().length > max) {
    throw new ValidationError(`Campo "${field}" deve ter no máximo ${max} caracteres.`);
  }
  return value.trim();
}

function optionalText(value, field, max) {
  if (value === undefined || value === null || (typeof value === "string" && value.trim() === "")) {
    return null;
  }
  if (typeof value !== "string") {
    throw new ValidationError(`Campo "${field}" deve ser texto.`);
  }
  if (value.trim().length > max) {
    throw new ValidationError(`Campo "${field}" deve ter no máximo ${max} caracteres.`);
  }
  return value.trim();
}

function requireRating(value) {
  if (!Number.isInteger(value) || value < 0 || value > 10) {
    throw new ValidationError('Campo "rating" deve ser um inteiro entre 0 e 10.');
  }
  return value;
}

function toDate(value, field) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Campo "${field}" deve ser uma data válida.`);
  }
  return date;
}
