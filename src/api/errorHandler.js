import { NotFoundError, ValidationError } from "../domain/errors/index.js";

/**
 * API — traduz erros em respostas HTTP. Os erros de domínio não conhecem
 * HTTP; só esta camada decide o status.
 */
export function errorHandler(logger) {
  // eslint-disable-next-line no-unused-vars
  return (error, req, res, next) => {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: "ValidationError", message: error.message });
    }
    if (error instanceof NotFoundError) {
      return res.status(404).json({ error: "NotFound", message: error.message });
    }
    if (error?.type === "entity.parse.failed") {
      return res.status(400).json({ error: "ValidationError", message: "JSON inválido no corpo da requisição." });
    }
    logger.error(error);
    return res.status(500).json({ error: "InternalError", message: "Erro interno no servidor." });
  };
}
