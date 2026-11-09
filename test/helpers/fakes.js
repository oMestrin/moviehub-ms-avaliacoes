import { Review } from "../../src/domain/Review.js";

export const NOW = new Date("2026-11-08T12:00:00.000Z");
export const MOVIE = "4f3c2a1e-0001-4b8e-9f00-000000000001";

export const fixedClock = (date = NOW) => ({ now: () => date });

export function sequenceIds(prefix = "r") {
  let n = 0;
  return { next: () => `${prefix}-${++n}` };
}

/** Publicador falso: guarda os eventos para o teste conferir. */
export function recordingPublisher() {
  const events = [];
  return { events, publish: async (event) => void events.push(event) };
}

export const validInput = Object.freeze({ movieId: MOVIE, author: "Leandro", rating: 9, comment: "Excelente!" });

export function aReview(overrides = {}) {
  return Review.create({ ...validInput, ...overrides }, { id: overrides.id ?? "r-0", now: overrides.now ?? NOW });
}
