import { defineInterface } from "../../shared/kernel/defineInterface.js";

/** Porta de saída (Application) — geração de identificadores. next() -> string */
export const IdGenerator = defineInterface("IdGenerator", ["next"]);
