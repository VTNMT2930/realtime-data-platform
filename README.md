# Realtime Data Platform

This repository implements a simple realtime data platform for producing and consuming Kafka messages with persistence and monitoring. It contains two main backend services and a Vue frontend:

- `backend/api-gateway-producer` — NestJS service that provides producer APIs, Admin endpoints, file upload worker (BullMQ), WebSocket gateway and TypeORM entities for producer logs.
- `backend/consumer-service` — NestJS service that runs Kafka consumers (kafkajs), persists consumer logs & manages consumer instances.
- `frontend` — Vue 3 + Vite single-page app used as UI and control panel.

See `REPORT.md` for a complete automated analysis of code structure, database schema, API endpoints and recommended improvements.

## Quickstart (developer)

Prerequisites
- Node.js (>=18)
- npm (or pnpm/yarn)
- PostgreSQL (or compatible) for TypeORM
- Redis (for BullMQ)
- Kafka / Redpanda for message broker

The project contains a `docker-compose.yml` (root) which can be used to bring up Kafka/Redpanda, Postgres and Redis for local development. Adjust environment values as needed.

Recommended workflow (PowerShell commands)

1) From repository root, install dependencies for each service:

```powershell
cd backend/api-gateway-producer; npm install; cd ../../consumer-service; npm install; cd ..\..\frontend; npm install; cd ..\..
```

2) Run services individually (development)

Start producer API (api-gateway-producer):
```powershell
cd backend/api-gateway-producer
npm run start:dev
```

Start consumer-service (consumer-service):
```powershell
cd backend/consumer-service
npm run start:dev
```

Start frontend (dev server):
```powershell
cd frontend
npm run dev
```

3) Using Docker Compose (recommended for local integration)

If you prefer containers, start infrastructure services (Postgres, Redis, Kafka) via docker-compose:

```powershell
docker-compose up -d
```

After infra is up, start the backend services as above (or create container images / compose overrides to run them inside Docker).

## Environment variables (important)

Common env vars used by services (check `app.module.ts` and `consumers.module.ts` for exact usage):

- `DATABASE_URL` or TypeORM-specific settings: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — PostgreSQL connection
- `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT` — Redis used by BullMQ
- `KAFKA_BROKERS` — comma-separated list of Kafka brokers (e.g. `localhost:9092`)
- `KAFKA_GROUP_ID`, `KAFKA_CLIENT_ID` — Kafka client/group IDs
- `PORT` — service port override
- `CONSUMER_ID`, `KAFKA_TOPIC_NAME` — consumer instance settings for `consumer-service`

Check each service `src/app.module.ts` for how `TypeOrmModule.forRoot()` and `ConfigModule` read env values.

## Database

The project uses TypeORM (`typeorm` + `pg`). Entities present (in code) create these tables:

- `producer_logs` — producer log summaries, batch logs, statuses
- `consumer_logs` — per-consumer persisted messages and metadata
- `consumer_instances` — runtime tracking of consumer instances and heartbeats

Note: explicit TypeORM migration files were not found in the repository. For production use, add migrations or export schema definitions. Using TypeORM `synchronize: true` in production is not recommended.

## APIs (short summary)

Producer service (base path `/api/producers`):
- `POST /api/producers/send/single` — send a single message to Kafka (query `topic` optional)
- `POST /api/producers/upload/csv` — upload CSV file (FormData `file`) to be processed in batches
- `GET /api/producers/logs` — list logs (filter by `topic`, `type`, pagination)
- `GET /api/producers/logs/:id` — get log by id
- `GET /api/producers/uploads` — file upload summaries
- `GET /api/producers/statistics` — producer statistics

Admin (base path `/api/admin`):
- `POST /api/admin/topics` — create topic
- `GET /api/admin/topics` — list topics
- `GET /api/admin/topics/:topicName` — topic details
- `DELETE /api/admin/topics/:topicName` — delete topic
- `PATCH /api/admin/topics/:topicName` — update topic
- `POST /api/admin/consumers` — spawn consumer (dev: spawn local process; prod: call consumer-service)

Consumer service (base path `/api/consumers`):
- `POST /api/consumers/instances` — create consumer instance record
- `GET /api/consumers/logs` — list consumer logs
- `GET /api/consumers/logs/:id` — get consumer log
- `GET /api/consumers/logs/search/:originalLogId` — find by producer log id
- `GET /api/consumers/stats` & `/api/consumers/stats/detailed` — stats
- `GET /api/consumers/instances` — list instances; `PUT /instances/:id/resume`, `PUT /instances/:id/stop`, `DELETE /instances/:id`

Note: The frontend `frontend/src/services/apiService.js` references two producer endpoints (`PATCH /api/producers/logs/:id/consumed` and `PATCH /api/producers/logs/:id/consume-failed`) that are not present in backend controllers as of this repo snapshot. Either implement those endpoints or remove the UI references.

## Worker / Queue

- CSV processing is done via BullMQ (`bullmq`) and requires Redis. Jobs are enqueued in the producer controller and processed by a `@Process('process-csv-job')` worker.

## WebSocket

- The producer API broadcasts log-created and log-updated events through a Socket.IO gateway. The frontend listens to these events for realtime updates.

## Troubleshooting & notes

- If DB tables are missing, check TypeORM configuration. Consider generating migrations and running them before starting services.
- Ensure Kafka and Redis are reachable by the services (check `KAFKA_BROKERS` and `REDIS_HOST`).
- Admin spawn consumer in dev uses `npm run start:dev` in `consumer-service` — this requires Node and dependencies installed in that folder.

## Contributing & next actions

- See `REPORT.md` for the automated code analysis, database table definitions and recommended improvements.
- Recommended enhancements: add migrations, Swagger/OpenAPI generation, add missing producer PATCH endpoints or remove UI references, add auth for admin endpoints, add input validation & upload size limits.

---
Generated by repository analysis. If you want, I can also:
- implement the missing PATCH endpoints for producer logs,
- add a TypeORM migration skeleton,
- or generate Swagger docs from the NestJS controllers.
