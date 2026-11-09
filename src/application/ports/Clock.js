import { defineInterface } from "../../shared/kernel/defineInterface.js";

/** Porta de saída (Application) — relógio. now() -> Date. Permite testes determinísticos. */
export const Clock = defineInterface("Clock", ["now"]);
