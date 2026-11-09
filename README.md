# MovieHub — Microsserviço de Avaliações

Avaliações dos filmes feitas pelos membros: CRUD completo com persistência no **Azure SQL Database** e documentação **Swagger**. Cada avaliação criada, alterada ou removida publica um evento (CloudEvents 1.0) na fila `avaliacoes-eventos` do **Azure Storage**, que dispara a Azure Function do MovieHub.

## Arquitetura

Clean Architecture (Domain, Application, Infrastructure, API) organizada em **Vertical Slices**.

```
src/
├── domain/               Review (entidade), ReviewEvents (tipos de evento), erros
├── application/ports/    ReviewRepository, EventPublisher, IdGenerator, Clock
├── features/
│   ├── list-reviews/         GET /reviews?movieId=
│   ├── get-review/           GET /reviews/:id
│   ├── create-review/        POST /reviews        → evento moviehub.avaliacao.registrada
│   ├── update-review/        PUT /reviews/:id     → evento moviehub.avaliacao.atualizada
│   ├── delete-review/        DELETE /reviews/:id  → evento moviehub.avaliacao.removida
│   ├── get-movie-stats/      GET /movie-stats/:movieId (média e quantidade)
│   └── list-movie-stats/     GET /movie-stats
├── infrastructure/
│   ├── persistence/      SqlReviewRepository (mssql, cria a tabela se não existir), InMemoryReviewRepository
│   └── messaging/        AzureQueueEventPublisher (CloudEvents em Base64), SafeEventPublisher, LogEventPublisher
├── api/                  createApp (Express), OpenAPI, tratamento de erros
├── container.js          composition root
└── main.js               lê o ambiente e sobe o servidor
```

Os testes de arquitetura (ArchUnitTS) garantem a regra da dependência, o isolamento das slices, que `mssql` e `@azure/storage-queue` só aparecem na infraestrutura e que os casos de uso de escrita publicam pela porta `EventPublisher`.

## Tecnologias

Node.js 22, Express 5, mssql 11 (Azure SQL), @azure/storage-queue (Azure Queue Storage), CloudEvents 1.0, swagger-ui-express (OpenAPI 3), node:test, Azurite, ArchUnitTS, Docker, Azure Container Apps, GitHub Actions.

## Como executar

```bash
npm install
npm run dev   # sem SQL_CONNECTION_STRING usa memória; sem STORAGE_CONNECTION_STRING só registra os eventos no log
```

Swagger em http://localhost:3002/docs.

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | 3002 | Porta HTTP |
| `SQL_CONNECTION_STRING` | vazio | Connection string do Azure SQL (vazio = memória) |
| `STORAGE_CONNECTION_STRING` | vazio | Connection string do Storage Account da fila (`UseDevelopmentStorage=true` para o Azurite) |
| `EVENTS_QUEUE_NAME` | avaliacoes-eventos | Nome da fila |
| `SEED_ON_START` | true | Cadastra avaliações iniciais se a tabela estiver vazia |

### Testes

```bash
npm run test:unit         # domínio, casos de uso, repositório SQL e API
npm run test:integration  # publica na fila de verdade usando o Azurite
npm run test:arch         # ArchUnitTS
```

### Docker

```bash
docker build -t <usuario>/moviehub-ms-avaliacoes .
docker run -p 3002:8080 -e SQL_CONNECTION_STRING="..." -e STORAGE_CONNECTION_STRING="..." <usuario>/moviehub-ms-avaliacoes
```

O GitHub Actions roda os testes e publica `<usuario>/moviehub-ms-avaliacoes` no Docker Hub a cada push na `main`.

## Evento publicado

```json
{
  "specversion": "1.0",
  "id": "6f1d2c1e-...",
  "source": "/moviehub/ms-avaliacoes",
  "type": "moviehub.avaliacao.registrada",
  "time": "2026-11-08T12:00:00.000Z",
  "subject": "movies/4f3c2a1e-0001-4b8e-9f00-000000000001",
  "datacontenttype": "application/json",
  "data": { "reviewId": "9a0c7e52-...", "movieId": "4f3c2a1e-...", "rating": 9 }
}
```

A especificação completa dos eventos (AsyncAPI) está em `moviehub-function/docs/asyncapi.yaml`.

## Repositórios do MovieHub

| Repositório | Papel |
|---|---|
| `moviehub-frontend` | Microfrontend React (shell + MFE Catálogo + MFE Avaliações) |
| `moviehub-bff` | BFF em Node/Express, único ponto de entrada do frontend (atrás do API Management) |
| `moviehub-ms-filmes` | Microsserviço de filmes — MongoDB Atlas |
| `moviehub-ms-avaliacoes` | Microsserviço de avaliações — Azure SQL, publica eventos na fila |
| `moviehub-function` | Azure Function — gatilho HTTP (insights) e gatilho de fila (eventos de avaliação) |

## Grupo

PJBL de Arquitetura de Soluções com Cloud — PUCPR, prof. Manoel Valerio da Silveira Neto.

- Brayan Calisto dos Santos
- Caio Gabriel Silva
- Juliana Flores de Lima
- Leandro de Freitas Pires
