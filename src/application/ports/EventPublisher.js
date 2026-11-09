import { defineInterface } from "../../shared/kernel/defineInterface.js";

/**
 * Porta de saída (Application) — publicação de eventos de domínio.
 * Implementação de produção: fila do Azure Storage (consumida pela Azure Function).
 *
 * publish(event) -> Promise<void>
 */
export const EventPublisher = defineInterface("EventPublisher", ["publish"]);
