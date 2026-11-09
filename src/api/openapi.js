/**
 * API — documentação OpenAPI 3.0 do microsserviço (servida em /docs e /openapi.json).
 */
const idParam = { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Id da avaliação" };
const json = (schema) => ({ "application/json": { schema } });
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const errorResponse = (description) => ({ description, content: json(ref("Error")) });

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "MovieHub — Microsserviço de Avaliações",
    version: "1.0.0",
    description:
      "Avaliações dos filmes feitas pelos membros. Persistência no Azure SQL Database. " +
      "Cada criação, alteração ou remoção publica um evento (CloudEvents) na fila `avaliacoes-eventos` do Azure Storage, " +
      "consumida pela Azure Function do MovieHub. Organizado em Clean Architecture + Vertical Slice."
  },
  tags: [{ name: "Avaliações" }, { name: "Estatísticas" }, { name: "Saúde" }],
  paths: {
    "/reviews": {
      get: {
        tags: ["Avaliações"],
        summary: "Lista avaliações (mais recentes primeiro)",
        parameters: [{ name: "movieId", in: "query", schema: { type: "string" }, description: "Filtra pelas avaliações de um filme" }],
        responses: { 200: { description: "Lista de avaliações", content: json({ type: "array", items: ref("Review") }) } }
      },
      post: {
        tags: ["Avaliações"],
        summary: "Registra uma avaliação",
        description: "Publica o evento `moviehub.avaliacao.registrada`.",
        requestBody: { required: true, content: json(ref("ReviewInput")) },
        responses: { 201: { description: "Avaliação criada", content: json(ref("Review")) }, 400: errorResponse("Dados inválidos") }
      }
    },
    "/reviews/{id}": {
      get: {
        tags: ["Avaliações"],
        summary: "Busca uma avaliação",
        parameters: [idParam],
        responses: { 200: { description: "Avaliação", content: json(ref("Review")) }, 404: errorResponse("Não encontrada") }
      },
      put: {
        tags: ["Avaliações"],
        summary: "Altera nota e comentário",
        description: "Publica o evento `moviehub.avaliacao.atualizada`.",
        parameters: [idParam],
        requestBody: { required: true, content: json(ref("ReviewUpdate")) },
        responses: { 200: { description: "Avaliação alterada", content: json(ref("Review")) }, 400: errorResponse("Dados inválidos"), 404: errorResponse("Não encontrada") }
      },
      delete: {
        tags: ["Avaliações"],
        summary: "Remove uma avaliação",
        description: "Publica o evento `moviehub.avaliacao.removida`.",
        parameters: [idParam],
        responses: { 204: { description: "Removida" }, 404: errorResponse("Não encontrada") }
      }
    },
    "/movie-stats": {
      get: {
        tags: ["Estatísticas"],
        summary: "Média e quantidade de avaliações de todos os filmes avaliados",
        responses: { 200: { description: "Estatísticas por filme", content: json({ type: "array", items: ref("MovieStats") }) } }
      }
    },
    "/movie-stats/{movieId}": {
      get: {
        tags: ["Estatísticas"],
        summary: "Média e quantidade de avaliações de um filme",
        parameters: [{ name: "movieId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Estatísticas do filme", content: json(ref("MovieStats")) } }
      }
    },
    "/health": {
      get: { tags: ["Saúde"], summary: "Verifica o serviço e a conexão com o banco", responses: { 200: { description: "Saudável" }, 503: { description: "Banco indisponível" } } }
    }
  },
  components: {
    schemas: {
      ReviewInput: {
        type: "object",
        required: ["movieId", "author", "rating"],
        properties: {
          movieId: { type: "string", example: "4f3c2a1e-0001-4b8e-9f00-000000000001" },
          author: { type: "string", maxLength: 80, example: "Leandro" },
          rating: { type: "integer", minimum: 0, maximum: 10, example: 9 },
          comment: { type: "string", maxLength: 1000, nullable: true, example: "Excelente!" }
        }
      },
      ReviewUpdate: {
        type: "object",
        required: ["rating"],
        properties: {
          rating: { type: "integer", minimum: 0, maximum: 10, example: 8 },
          comment: { type: "string", maxLength: 1000, nullable: true }
        }
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string" },
          movieId: { type: "string" },
          author: { type: "string" },
          rating: { type: "integer" },
          comment: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      MovieStats: {
        type: "object",
        properties: {
          movieId: { type: "string" },
          average: { type: "number", nullable: true, example: 8.5 },
          count: { type: "integer", example: 4 }
        }
      },
      Error: { type: "object", properties: { error: { type: "string" }, message: { type: "string" } } }
    }
  }
};
