// Publica um evento numa fila real do Azure Storage (emulador Azurite) e confere
// que a mensagem chega em Base64 com o envelope CloudEvents — o formato que o
// gatilho de fila da Azure Function espera.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { QueueClient } from "@azure/storage-queue";
import { AzureQueueEventPublisher } from "../../src/infrastructure/messaging/AzureQueueEventPublisher.js";
import { ReviewEventType, reviewEvent } from "../../src/domain/ReviewEvents.js";
import { NOW, aReview } from "../helpers/fakes.js";

const PORT = 10101;
const CONNECTION =
  "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;" +
  "AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;" +
  `QueueEndpoint=http://127.0.0.1:${PORT}/devstoreaccount1;`;

let azurite;

before(async () => {
  const bin = createRequire(import.meta.url).resolve("azurite/dist/src/queue/main.js");
  azurite = spawn(process.execPath, [bin, "--queuePort", String(PORT), "--location", mkdtempSync(join(tmpdir(), "azurite-")), "--silent", "--skipApiVersionCheck"], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/`);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error("Azurite não subiu");
});

after(() => azurite?.kill());

test("AzureQueueEventPublisher envia CloudEvent em Base64 para a fila", async () => {
  const publisher = AzureQueueEventPublisher.fromConnectionString(CONNECTION, "avaliacoes-eventos");
  await publisher.ensureQueue();
  await publisher.publish(reviewEvent(ReviewEventType.REGISTERED, aReview({ id: "r-1" }), NOW));

  const { receivedMessageItems } = await new QueueClient(CONNECTION, "avaliacoes-eventos").receiveMessages();
  assert.equal(receivedMessageItems.length, 1);
  const cloudEvent = JSON.parse(Buffer.from(receivedMessageItems[0].messageText, "base64").toString("utf8"));
  assert.equal(cloudEvent.specversion, "1.0");
  assert.equal(cloudEvent.type, "moviehub.avaliacao.registrada");
  assert.equal(cloudEvent.source, "/moviehub/ms-avaliacoes");
  assert.equal(cloudEvent.time, NOW.toISOString());
  assert.deepEqual(cloudEvent.data, { reviewId: "r-1", movieId: "4f3c2a1e-0001-4b8e-9f00-000000000001", rating: 9 });
});
