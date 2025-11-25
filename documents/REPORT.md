**Realtime Data Platform — Codebase Analysis Report**

Tóm tắt kỹ thuật, dựa trực tiếp trên mã nguồn trong repository `realtime-data-platform`.

**1. Cấu trúc thư mục (chính, khung cao)**
- `backend/`
  - `api-gateway-producer/` : NestJS app cung cấp API cho producer + admin, queue worker (BullMQ), WebSocket gateway, TypeORM
    - `src/` : controllers, modules, services (`producers`, `admin`, `kafka`, `producers.gateway`, entities ...)
    - `package.json` : deps (NestJS, TypeORM, kafkajs, bullmq, pg, socket.io)
  - `consumer-service/` : NestJS app - Kafka consumer(s), consumer instance management, TypeORM entities
    - `src/consumers/` : `consumers.controller.ts`, `consumers.service.ts`, `entities/` (consumer logs, instances)
    - `package.json` : deps (kafkajs, TypeORM, pg)
- `frontend/` : Vue 3 + Vite SPA (UI), `src/services/apiService.js` chứa các gọi API dùng trong UI
- Root docs: multiple markdown guides (WebSocket, topics, consumer guides, etc.)

**2. Database (TypeORM / PostgreSQL) — Bảng & cột (trích từ entity files)**

Ghi chú: ứng dụng sử dụng `typeorm` + `pg` (Postgres). Dưới đây là các entity thực tế trong mã.

| Table name | Column | Type (TS/DB) | PK / Notes |
|---|---:|---|---|
| `producer_logs` | `id` | UUID (PrimaryGeneratedColumn('uuid')) | PK |
|  | `type` | enum(`SINGLE`|`FILE`) | |
|  | `status` | enum(`PENDING`,`PROCESSING`,`COMPLETED`,`FAILED`) | |
|  | `data` | text (JSON string) | nullable |
|  | `topic` | varchar | nullable |
|  | `originalFileName` | varchar | nullable (for FILE)
|  | `filePath` | varchar | nullable
|  | `bullJobId` | varchar | nullable
|  | `errorMessage` | text | nullable
|  | `createdAt` | timestamp (CreateDateColumn) | |
|  | `updatedAt` | timestamp (UpdateDateColumn) | |

| `consumer_logs` | `id` | UUID (PrimaryGeneratedColumn('uuid')) | PK |
|  | `originalLogId` | varchar | references producer log id (string)
|  | `topic` | varchar(255) | nullable (Kafka topic)
|  | `partition` | int | nullable
|  | `offset` | varchar(50) | nullable
|  | `status` | enum(`RECEIVED`,`PROCESSING`,`PROCESSED`,`FAILED`) | |
|  | `data` | text (stringified JSON) | contains `{ metadata, content, messageType }`
|  | `consumerId` | varchar(255) | nullable (which instance processed it)
|  | `errorMessage` | text | nullable
|  | `createdAt` | timestamp | |
|  | `updatedAt` | timestamp | |

| `consumer_instances` | `id` | varchar(255) (PrimaryColumn) | PK (consumer id e.g. `consumer-...`)
|  | `status` | enum(`ACTIVE`,`INACTIVE`) | |
|  | `hostname` | varchar(255) | nullable
|  | `port` | int | nullable
|  | `pid` | int | nullable
|  | `topicName` | varchar(255) | nullable
|  | `lastHeartbeat` | timestamp | default CURRENT_TIMESTAMP
|  | `shouldStop` | boolean | default false
|  | `isDeleted` | boolean | default false (soft delete)
|  | `groupId` | varchar(255) | nullable (Kafka consumer group)
|  | `createdAt` | timestamp | |
|  | `updatedAt` | timestamp | |

**3. Danh sách & mô tả chức năng hệ thống (chính)**
- Producer API (`api-gateway-producer`):
  - Nhận message đơn (`POST /api/producers/send/single`) và gửi tới Kafka; lưu log `producer_logs`.
  - Upload CSV (`POST /api/producers/upload/csv`) → tạo summary log (FILE, PENDING) → tạo BullMQ job `process-csv-job` để đọc CSV, chia batch, gửi từng batch vào Kafka, tạo batch logs, cập nhật summary.
  - Lấy logs, log by id, uploads summary, statistics (`GET /api/producers/...`).
  - WebSocket broadcasting từ `ProducersGateway` để đẩy cập nhật log lên UI khi log được tạo / cập nhật.
  - Admin APIs để quản lý topic (create/list/detail/delete/update) và start/stop/spawn consumer (kết hợp gọi trực tiếp service consumer hoặc spawn local process trong dev).

- Consumer service (`consumer-service`):
  - Kafka consumer (kafkajs) subscribe topic(s); `eachMessage` gọi `processTransaction`.
  - `processTransaction` lưu `consumer_logs` (RECEIVED → PROCESSING → PROCESSED/FAILED), mô phỏng xử lý, cập nhật trạng thái.
  - Quản lý consumer instances: register, heartbeat, cleanup stale, resume, stop, delete (soft delete + attempt kill PID). Có API để tạo instance record (`POST /api/consumers/instances`).
  - Expose APIs: get logs (paginated), get log by id, get log by original producer id, get stats, get instances, resume/stop/delete instance.

**4. API Endpoints (tổng hợp từ controllers và `frontend/src/services/apiService.js`)**

Ghi chú: tất cả endpoint paths tiền tố `api` trên frontend; backend NestJS controllers định nghĩa base path tương ứng. Bảng dưới tóm lược endpoint thực tế đã tìm thấy trong mã backend (controller files). Nếu frontend gọi endpoint không tồn tại trong backend, ghi chú bên cạnh.

| Path | Method | Source (controller) | Request params / body | Response (từ code) |
|---|---:|---|---|---|
| `/api/producers/send/single` | POST | `ProducersController.createTransaction` | Body: `CreateTransactionDto` (arbitrary JSON). Query: `topic` optional | {status,message,logId,topic} on success; error object on failure |
| `/api/producers/upload/csv` | POST | `ProducersController.uploadFile` | multipart FormData file field `file`. Query: `topic` optional | {message,jobId,topic} (creates DB log + Bull job) |
| `/api/producers/logs` | GET | `ProducersController.getLogs` | Query: `topic,page,limit,type` | paginated logs: {success,data,pagination} |
| `/api/producers/logs/:id` | GET | `ProducersController.getLogById` | Param `id` | {success,data:{...log,parsedData}} or not-found message |
| `/api/producers/uploads` | GET | `ProducersController.getFileUploads` | Query: `topic,page,limit` | file upload summaries + pagination |
| `/api/producers/statistics` | GET | `ProducersController.getStatistics` | Query: `topic` (controller doesn't use param in current impl) | {success,summary,byTopic} |
| `/api/producers/test/create-failed-log` | POST | `ProducersController.createFailedLog` | Query: `type,topic` | creates a FAILED log for testing; returns saved log id |

| `/api/admin/topics` | POST | `AdminController.createTopic` | Body: `{topicName,numPartitions,replicationFactor}` | {status:'success'|'error'|'warn', message} |
| `/api/admin/topics` | GET | `AdminController.listTopics` | - | {status:'success', data: [topics enriched with producer/consumer stats]} |
| `/api/admin/topics/:topicName` | GET | `AdminController.getTopicDetail` | Param `topicName` | {status:'success', data:{ metadata, configs }} |
| `/api/admin/topics/:topicName` | DELETE | `AdminController.deleteTopic` | Param | {status:'success'|'error', message} |
| `/api/admin/topics/:topicName` | PATCH | `AdminController.updateTopic` | Body: `{numPartitions?, configs?}` | {status:'success'|'error', message} |

| `/api/admin/consumers` | POST | `AdminController.spawnConsumer` | Body: `{ consumerId?, groupId?, topicName? }` | Calls `AdminService.spawnConsumer`; returns status + consumerId. In production cloud mode it calls consumer service API `/api/consumers/instances` |
| `/api/admin/consumers` | GET | `AdminController.getRunningConsumers` | - | calls AdminService.getRunningConsumers (which queries consumer service API) |

| `/api/consumers/instances` | POST | `ConsumersController.createConsumerInstanceEntry` (consumer-service) | Body: `{topicName, groupId?}` | {success,message,consumerId} (creates record in `consumer_instances`) |
| `/api/consumers/logs` | GET | `ConsumersController.getAllLogs` | Query: `consumerId,topic,status,page,limit` | paginated consumer logs |
| `/api/consumers/logs/:id` | GET | `ConsumersController.getConsumerLogById` | Param `id` | {success,data:{...log,parsedData}} |
| `/api/consumers/logs/search/:originalLogId` | GET | `ConsumersController.getLogByOriginalId` | Param `originalLogId` | {found,log,processedBy,status} |
| `/api/consumers/stats` | GET | `ConsumersController.getConsumerStats` | - | consumer statistics object (includes instances list) |
| `/api/consumers/stats/detailed` | GET | `ConsumersController.getDetailedConsumerStats` | - | per-consumer status counts |
| `/api/consumers/instances` | GET | `ConsumersController.getConsumerInstances` | Query `status?` | list of consumer instance records |
| `/api/consumers/instances/:consumerId/resume` | PUT | `ConsumersController.resumeConsumerInstance` | Param `consumerId` | resume result object |
| `/api/consumers/instances/:consumerId/stop` | PUT | `ConsumersController.stopConsumerInstance` | Param `consumerId` | stop result object |
| `/api/consumers/instances/:consumerId` | DELETE | `ConsumersController.deleteConsumerInstance` | Param `consumerId` | deletion result object |

Notes on frontend/back-end parity:
- Frontend `apiService.js` calls additional endpoints `PATCH /api/producers/logs/:id/consumed` and `PATCH /api/producers/logs/:id/consume-failed` which are not present in backend controller files scanned. These appear referenced by the UI but no controller implementation was found in `api-gateway-producer` source.

**5. Luồng xử lý (flow) — tóm tắt**
- Producer (single message): client → `POST /producers/send/single` → create producer_log (PENDING) → send Kafka message (via NestJS Kafka client) → update producer_log to COMPLETED → WebSocket broadcast update.
- Producer (CSV): client uploads CSV → `POST /producers/upload/csv` → create producer_log (FILE, PENDING) + add BullMQ job → worker `processCsvJob` reads CSV, batches (BATCH_SIZE=100), for each batch create batch log + emit to Kafka → after all batches update summary log → broadcast updates.
- Consumer(s): Kafka consumer(s) (kafkajs) receive messages → `processTransaction` creates consumer_log (RECEIVED) → set PROCESSING → simulate handling → set PROCESSED or FAILED → DB persists metadata (topic, partition, offset, consumerId).
- Admin: uses Kafka Admin APIs to manage topics; can spawn local consumer processes in dev or call consumer-service API in cloud mode to create instance records.

**6. Kiến trúc & thành phần chính**
- Application style: microservices-like split: `api-gateway-producer` (producer API, admin, websocket, job worker) + `consumer-service` (consumers). Communication via Kafka topics (kafkajs + @nestjs/microservices wrapper). DB for persistence: PostgreSQL via TypeORM.
- Background jobs: BullMQ (`bullmq`) + Redis used for queueing CSV processing jobs.
- Realtime UI: WebSocket (Socket.IO) via `@nestjs/websockets` + `socket.io`.
- Observability: controllers/services write console logs; no dedicated logging framework found.

**7. Thư viện chính (từ package.json)**
- Backend: `@nestjs/*`, `typeorm`, `pg`, `kafkajs`, `bullmq`, `redis`, `socket.io`, `axios`.
- Frontend: `vue`, `vite`, `socket.io-client` (see `frontend/package.json`).

**8. Điểm chú ý / Những gì tìm thấy trong mã (khuyến cáo)**
- DB schema: Entities present for `producer_logs`, `consumer_logs`, `consumer_instances`. Không thấy migration files in repo — DB schema creation relies on TypeORM sync or external migrations (not found).
- UI gọi vài endpoint PATCH cho producer logs consume status which don't exist in backend — potential mismatch (frontend/back-end contract drift).
- Admin spawn local consumer logic uses `spawn('npm', ['run', 'start:dev'])` — works in dev but requires careful environment controls in production.

**9. Đề xuất cải tiến (ít nhất 2)**
1) Thêm file migration / schema management: add TypeORM migrations or Prisma schema + migration scripts to ensure deterministic schema creation across environments (production safety).  
2) API contract verification: add integration tests or OpenAPI spec (Swagger) and keep frontend `apiService.js` in sync; implement the two missing PATCH endpoints or remove references from UI.  
3) Security & hardening (bonus): add input validation / size limits on CSV uploads, authentication & RBAC for admin endpoints, and safe process spawn controls (rate-limit spawn, disallow arbitrary PID kills).

**10. Next steps (suggested)**
- Provide missing OpenAPI/Swagger generation from NestJS controllers.  
- Add README short-run instructions for local dev (DB, Redis, Kafka/Redpanda).  
- (Optional) Run static analysis / tests — I can help implement migrations or add API docs.

---
Report generated from code files under `backend/` and `frontend/src/services/apiService.js` (controllers, entities, services) — no speculation beyond code contents.
