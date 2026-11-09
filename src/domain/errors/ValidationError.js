import { DomainError } from "./DomainError.js";

/** Violação de invariante de domínio (ex.: autor vazio, nota fora de 0–10). */
export class ValidationError extends DomainError {}
