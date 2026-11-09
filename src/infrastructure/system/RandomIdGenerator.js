import { randomUUID } from "node:crypto";

/** Infraestrutura — gera ids UUID v4. Implementa a porta IdGenerator. */
export class RandomIdGenerator {
  next() {
    return randomUUID();
  }
}
