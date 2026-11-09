import { DomainError } from "./DomainError.js";

/** Recurso de domínio inexistente (ex.: avaliação com id desconhecido). */
export class NotFoundError extends DomainError {}
