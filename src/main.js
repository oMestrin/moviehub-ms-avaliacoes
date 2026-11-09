import sql from "mssql";
import { buildApp } from "./container.js";
import { AzureQueueEventPublisher } from "./infrastructure/messaging/AzureQueueEventPublisher.js";
import { LogEventPublisher } from "./infrastructure/messaging/LogEventPublisher.js";
import { SafeEventPublisher } from "./infrastructure/messaging/SafeEventPublisher.js";
import { InMemoryReviewRepository } from "./infrastructure/persistence/InMemoryReviewRepository.js";
import { SqlReviewRepository } from "./infrastructure/persistence/SqlReviewRepository.js";
import { seedReviewsIfEmpty } from "./infrastructure/persistence/seedReviews.js";

/**
 * Ponto de entrada: lê a configuração, escolhe as implementações das portas e
 * sobe o servidor HTTP.
 *
 *   PORT                        porta HTTP (padrão 3002)
 *   SQL_CONNECTION_STRING       connection string do Azure SQL (ADO.NET); vazia = memória
 *   STORAGE_CONNECTION_STRING   connection string do Storage Account; vazia = só loga os eventos
 *   EVENTS_QUEUE_NAME           nome da fila de eventos (padrão "avaliacoes-eventos")
 *   SEED_ON_START               "false" desliga as avaliações de exemplo
 */
const port = Number(process.env.PORT ?? 3002);
const logger = {
  info: (message) => console.log(`[ms-avaliacoes] ${message}`),
  error: (error) => console.error("[ms-avaliacoes]", error)
};

let pool;
let reviewRepository;

if (process.env.SQL_CONNECTION_STRING) {
  pool = await new sql.ConnectionPool(process.env.SQL_CONNECTION_STRING).connect();
  reviewRepository = new SqlReviewRepository(pool);
  await reviewRepository.ensureSchema();
  logger.info("conectado ao Azure SQL");
} else {
  reviewRepository = new InMemoryReviewRepository();
  logger.info("SQL_CONNECTION_STRING não definida: usando repositório em memória");
}

let publisher;
if (process.env.STORAGE_CONNECTION_STRING) {
  const queueName = process.env.EVENTS_QUEUE_NAME ?? "avaliacoes-eventos";
  publisher = AzureQueueEventPublisher.fromConnectionString(process.env.STORAGE_CONNECTION_STRING, queueName);
  await publisher.ensureQueue();
  logger.info(`publicando eventos na fila "${queueName}"`);
} else {
  publisher = new LogEventPublisher(logger);
  logger.info("STORAGE_CONNECTION_STRING não definida: eventos só serão registrados no log");
}
const eventPublisher = new SafeEventPublisher(publisher, logger);

if (process.env.SEED_ON_START !== "false") {
  const inserted = await seedReviewsIfEmpty(reviewRepository);
  if (inserted > 0) {
    logger.info(`${inserted} avaliações de exemplo cadastradas`);
  }
}

const server = buildApp({ reviewRepository, eventPublisher, logger }).listen(port, () => {
  logger.info(`ouvindo na porta ${server.address().port} — Swagger em /docs`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(async () => {
      await pool?.close();
      process.exit(0);
    });
  });
}
