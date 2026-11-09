// Testes de arquitetura com ArchUnitTS.
// Camadas: src/domain, src/application, src/infrastructure, src/api.
// Slices: cada pasta em src/features é uma funcionalidade (caso de uso + endpoint).
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { extractGraph, projectFiles } from "archunit";
import { TSCONFIG, escapeRegExp, expectNoViolations, listSlices } from "./archunit.helpers.js";

const files = () => projectFiles(TSCONFIG);

const FEATURES = "src/features";
const DOMAIN = /^src\/(domain|shared\/kernel)\//;
const OUTSIDE_DOMAIN = /^src\/(?!(domain|shared\/kernel)\/)/;
const APPLICATION = /^src\/application\//;
const OUTSIDE_DOMAIN_AND_APPLICATION = /^src\/(?!(domain|application|shared\/kernel)\/)/;
const INFRASTRUCTURE = /^src\/infrastructure\//;
const API = /^src\/api\//;
const COMPOSITION = /^src\/(container|main)\.js$/;
const USE_CASE = /UseCase\.js$/;
const ENDPOINT = /\.endpoint\.js$/;

describe("Clean Architecture — regra da dependência", () => {
  test("Domain não depende de nenhuma outra camada", async () => {
    await expectNoViolations(files().inPath(DOMAIN).shouldNot().dependOnFiles().inPath(OUTSIDE_DOMAIN));
  });

  test("Application (portas) depende só do Domain", async () => {
    await expectNoViolations(files().inPath(APPLICATION).shouldNot().dependOnFiles().inPath(OUTSIDE_DOMAIN_AND_APPLICATION));
  });

  test("casos de uso dependem só de Domain e Application (portas)", async () => {
    // o grafo inclui o próprio arquivo do caso de uso, então ele é ignorado aqui
    const forbidden = new RegExp(OUTSIDE_DOMAIN_AND_APPLICATION.source + String.raw`(?!.*UseCase\.js$)`);
    await expectNoViolations(files().withName(USE_CASE).shouldNot().dependOnFiles().inPath(forbidden));
  });

  test("casos de uso importam ao menos uma porta (dependem da abstração)", async () => {
    await expectNoViolations(
      files()
        .withName(USE_CASE)
        .should()
        .adhereTo((file) => /from\s+["'][^"']*\/application\/ports\//.test(file.content), "caso de uso deve importar uma porta")
    );
  });

  test("endpoints (API) não dependem de Infrastructure nem da composição", async () => {
    await expectNoViolations(files().withName(ENDPOINT).shouldNot().dependOnFiles().inPath(INFRASTRUCTURE));
    await expectNoViolations(files().withName(ENDPOINT).shouldNot().dependOnFiles().inPath(COMPOSITION));
  });

  test("API não depende de Infrastructure, das slices nem da composição", async () => {
    await expectNoViolations(files().inPath(API).shouldNot().dependOnFiles().inPath(INFRASTRUCTURE));
    await expectNoViolations(files().inPath(API).shouldNot().dependOnFiles().inFolder(`${FEATURES}/**`));
    await expectNoViolations(files().inPath(API).shouldNot().dependOnFiles().inPath(COMPOSITION));
  });

  test("Infrastructure não depende de API, slices nem composição", async () => {
    await expectNoViolations(files().inPath(INFRASTRUCTURE).shouldNot().dependOnFiles().inPath(API));
    await expectNoViolations(files().inPath(INFRASTRUCTURE).shouldNot().dependOnFiles().inFolder(`${FEATURES}/**`));
    await expectNoViolations(files().inPath(INFRASTRUCTURE).shouldNot().dependOnFiles().inPath(COMPOSITION));
  });
});

describe("Vertical Slice — uma pasta por funcionalidade", () => {
  const slices = listSlices(FEATURES);

  test("as slices esperadas existem", () => {
    assert.deepEqual(slices.sort(), ["create-review", "delete-review", "get-movie-stats", "get-review", "list-movie-stats", "list-reviews", "update-review"]);
  });

  for (const slice of slices) {
    test(`slice "${slice}" não importa outra slice`, async () => {
      const otherSlices = new RegExp(`^${escapeRegExp(FEATURES)}/(?!${escapeRegExp(slice)}/)`);
      await expectNoViolations(files().inFolder(`${FEATURES}/${slice}/**`).shouldNot().dependOnFiles().inPath(otherSlices));
    });
  }

  test("cada slice tem exatamente um caso de uso e um endpoint", async () => {
    await expectNoViolations(
      files().inFolder(`${FEATURES}/**`).should().haveName(/^([A-Z]\w*UseCase|[a-z][\w]*\.endpoint)\.js$/)
    );
    for (const slice of slices) {
      const sliceFiles = (await extractGraph(TSCONFIG))
        .map((edge) => edge.source)
        .filter((source, i, all) => source.includes(`${FEATURES}/${slice}/`) && all.indexOf(source) === i);
      assert.equal(sliceFiles.filter((f) => USE_CASE.test(f)).length, 1, `${slice}: caso de uso`);
      assert.equal(sliceFiles.filter((f) => ENDPOINT.test(f)).length, 1, `${slice}: endpoint`);
    }
  });
});

describe("Frameworks e drivers ficam nas bordas", () => {
  const importsPackage = (name) => new RegExp(`from\\s+["']${escapeRegExp(name)}["']`);

  test("só src/api/createApp.js importa o Express e o Swagger UI", async () => {
    await expectNoViolations(
      files()
        .inFolder("src/**")
        .should()
        .adhereTo(
          (file) => !(importsPackage("express").test(file.content) || importsPackage("swagger-ui-express").test(file.content)) || file.path.endsWith("src/api/createApp.js"),
          "Express só pode ser importado em src/api/createApp.js"
        )
    );
  });

  test("só a persistência e o main.js importam o driver do SQL Server (mssql)", async () => {
    await expectNoViolations(
      files()
        .inFolder("src/**")
        .should()
        .adhereTo(
          (file) => !importsPackage("mssql").test(file.content) || /src\/(infrastructure\/persistence\/|main\.js$)/.test(file.path),
          "mssql só pode ser importado em infrastructure/persistence ou no main.js"
        )
    );
  });

  test("só a mensageria importa o SDK de filas do Azure", async () => {
    await expectNoViolations(
      files()
        .inFolder("src/**")
        .should()
        .adhereTo(
          (file) => !importsPackage("@azure/storage-queue").test(file.content) || file.path.includes("src/infrastructure/messaging/"),
          "@azure/storage-queue só pode ser importado em infrastructure/messaging"
        )
    );
  });

  test("casos de uso que alteram dados publicam evento pela porta EventPublisher", async () => {
    await expectNoViolations(
      files()
        .withName(/^(Create|Update|Delete)ReviewUseCase\.js$/)
        .should()
        .adhereTo((file) => /application\/ports\/EventPublisher\.js/.test(file.content) && /\.publish\(/.test(file.content), "deve publicar evento via EventPublisher")
    );
  });

  test("Domain e casos de uso não fazem I/O nem leem configuração", async () => {
    const noIo = (file) => !/\b(process\.env|fetch\(|console\.)/.test(file.content);
    await expectNoViolations(files().inPath(DOMAIN).should().adhereTo(noIo, "domínio deve ser puro"));
    await expectNoViolations(files().withName(USE_CASE).should().adhereTo(noIo, "caso de uso não faz I/O direto"));
  });

  test("repositórios seguem a convenção de nome em infrastructure/persistence", async () => {
    await expectNoViolations(
      files().inFolder("src/infrastructure/persistence/**").should().haveName(/^([A-Z]\w*Repository|reviewsSeed|seedReviews|statsMath)\.js$/)
    );
  });
});

describe("Saúde do grafo de dependências", () => {
  test("não há dependências cíclicas", async () => {
    await expectNoViolations(files().inFolder("src/**").should().haveNoCycles());
  });

  test("o ArchUnitTS leu os imports do projeto", async () => {
    const edges = (await extractGraph(TSCONFIG)).filter((edge) => edge.source !== edge.target && !edge.external);
    assert.ok(edges.length >= 30, `poucas dependências extraídas: ${edges.length}`);
    assert.ok(
      edges.some((edge) => edge.source.endsWith("CreateReviewUseCase.js") && edge.target.endsWith("application/ports/EventPublisher.js")),
      "dependência CreateReviewUseCase -> EventPublisher não encontrada"
    );
  });
});
