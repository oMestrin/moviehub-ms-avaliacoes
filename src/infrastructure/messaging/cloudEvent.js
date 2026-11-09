import { randomUUID } from "node:crypto";

export const EVENT_SOURCE = "/moviehub/ms-avaliacoes";

/** Envolve um evento de domínio no formato CloudEvents 1.0 (estrutura JSON). */
export function toCloudEvent(event, id = randomUUID()) {
  return {
    specversion: "1.0",
    id,
    source: EVENT_SOURCE,
    type: event.type,
    subject: event.subject,
    time: event.occurredAt.toISOString(),
    datacontenttype: "application/json",
    data: { ...event.data }
  };
}
