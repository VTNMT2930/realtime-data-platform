# 📁 Kafka Real-Time Data Platform - Project Structure

## 🗂️ Root Directory
```
realtime-data-platform/
├── backend/
│   ├── api-gateway-producer/     # NestJS - Producer & Admin API
│   └── consumer-service/          # NestJS - Consumer Service
├── frontend/                      # Vue 3 + Vite
├── docker-compose.yml             # Kafka + Zookeeper + PostgreSQL
└── Documentation files (*.md)
```

---

## 🔧 Backend - API Gateway Producer (`backend/api-gateway-producer/`)

### Core Structure
```
api-gateway-producer/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── admin/                     # 🔑 Admin & Topic Management
│   │   ├── admin.controller.ts    # - GET /api/admin/topics
│   │   ├── admin.service.ts       # - POST /api/admin/topics
│   │   ├── admin.module.ts        # - DELETE /api/admin/topics/:name
│   │   └── dto/                   # - POST /api/admin/start-consumer
│   │       ├── create-topic.dto.ts
│   │       └── create-consumer.dto.ts
│   │
│   ├── producers/                 # 📤 Message Producers
│   │   ├── producers.controller.ts # - POST /api/producers/send-single
│   │   ├── producers.service.ts    # - POST /api/producers/send-batch
│   │   ├── producers.gateway.ts    # - POST /api/producers/upload-csv
│   │   └── entities/
│   │       └── producer-log.entity.ts
│   │
│   ├── kafka/                     # Kafka Configuration
│   │   └── kafka.module.ts
│   │
│   └── common/                    # Shared utilities
│
├── .env                           # Environment variables
├── package.json
└── tsconfig.json
```

### Key Files
- **`admin.service.ts`**: 
  - Quản lý Kafka topics (create, delete, list)
  - Spawn consumer processes động
  - Broadcast WebSocket events đến Consumer Service

- **`producers.service.ts`**:
  - Gửi messages đến Kafka topics
  - Log producer statistics vào PostgreSQL
  - Support single message, batch, và CSV upload

---

## 🔧 Backend - Consumer Service (`backend/consumer-service/`)

### Core Structure
```
consumer-service/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   │
│   ├── consumers/                 # 📥 Consumer Management
│   │   ├── consumers.controller.ts # - GET /api/consumers/logs
│   │   ├── consumers.service.ts    # - GET /api/consumers/stats
│   │   ├── consumers.gateway.ts    # - GET /api/consumers/instances
│   │   ├── consumers.module.ts     # - PUT /api/consumers/instances/:id/stop
│   │   └── entities/              # - PUT /api/consumers/instances/:id/resume
│   │       ├── consumer-log.entity.ts
│   │       └── consumer-instance.entity.ts
│   │
│   └── common/
│       └── kafka/                 # 🎯 Kafka Consumer Logic
│           └── kafka.service.ts   # - Subscribe to topics động
│                                  # - Process messages
│                                  # - Update log status (RECEIVED → PROCESSING → PROCESSED/FAILED)
│
├── .env                           # Environment variables
│   ├── CONSUMER_ID               # Consumer instance ID
│   ├── PORT                      # WebSocket port
│   ├── KAFKA_TOPIC_NAME          # Topics to subscribe (comma-separated)
│   └── KAFKA_GROUP_ID            # Consumer group
│
├── package.json
└── tsconfig.json
```

### Key Files
- **`kafka.service.ts`**: 
  - Core consumer logic
  - Subscribe vào topics từ `KAFKA_TOPIC_NAME` environment variable
  - Process messages và update status trong database
  - Handle FAILED status cho test_failed topic

- **`consumers.service.ts`**:
  - Quản lý consumer instances (start, stop, delete)
  - Heartbeat mechanism để track consumer health
  - Statistics và metrics

---

## 🎨 Frontend (`frontend/`)

### Core Structure
```
frontend/
├── src/
│   ├── main.js                    # Vue app entry
│   ├── App.vue                    # Root component
│   │
│   ├── views/                     # 📄 Pages
│   │   ├── DashboardView.vue      # Producer overview
│   │   ├── ProducerDashboardView.vue
│   │   ├── ConsumerDashboardView.vue
│   │   ├── ConsumerListView.vue   # Consumer management
│   │   ├── TopicListView.vue      # Topic management
│   │   ├── TopicDetailView.vue
│   │   ├── AutoSendView.vue       # Auto-send messages
│   │   ├── ConfigurationView.vue
│   │   └── DebugLogsView.vue
│   │
│   ├── components/
│   │   └── common/                # 🧩 Reusable Components
│   │       ├── AddConsumerModal.vue      # ✅ Create consumer with topic
│   │       ├── CreateTopicModal.vue
│   │       ├── DeleteTopicModal.vue
│   │       ├── UpdateTopicModal.vue
│   │       ├── ProduceMessageModal.vue
│   │       ├── ConsumerList.vue
│   │       ├── SystemStatus.vue
│   │       ├── Toast.vue
│   │       └── ConfirmModal.vue
│   │
│   ├── services/
│   │   └── apiService.js          # 🔌 API calls
│   │       ├── getTopics()
│   │       ├── createConsumer()   # ✅ Pass topicName parameter
│   │       ├── sendSingleMessage()
│   │       └── ...
│   │
│   ├── stores/
│   │   └── kafkaStore.js          # Pinia state management
│   │
│   ├── router/
│   │   └── index.js               # Vue Router configuration
│   │
│   ├── layouts/
│   │   └── MainLayout.vue         # App layout with sidebar
│   │
│   ├── composables/
│   │   └── useToast.js            # Toast notifications
│   │
│   └── assets/
│       ├── base.css
│       └── main.css                # Tailwind CSS
│
├── public/
│   └── favicon.ico
│
├── index.html
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
├── package.json
└── jsconfig.json
```

### Key Components
- **`AddConsumerModal.vue`**: 
  - Select topic from dropdown
  - Create consumer với topic đã chọn
  - Pass `topicName` to backend API

- **`apiService.js`**:
  ```javascript
  export const createConsumer = (consumerId, groupId, topicName) => {
    return api.post('/admin/start-consumer', { 
      consumerId, 
      groupId, 
      topicName  // ✅ Truyền topic name
    });
  };
  ```

---

## 🐳 Docker (`docker-compose.yml`)

```yaml
services:
  zookeeper:    # Port 2181
  kafka:        # Port 9092
  postgres:     # Port 5432 (Producer DB)
  postgres-consumer: # Port 5433 (Consumer DB)
```

---

## 📊 Database Schema

### Producer Database (Port 5432)
```sql
producer_logs
├── id (UUID)
├── topic (VARCHAR)
├── data (TEXT - JSON)
├── status (ENUM: PENDING, SENT, FAILED)
├── error_message (TEXT)
└── created_at (TIMESTAMP)
```

### Consumer Database (Port 5433)
```sql
consumer_logs
├── id (UUID)
├── original_log_id (VARCHAR)
├── topic (VARCHAR)
├── partition (INT)
├── offset (BIGINT)
├── data (TEXT - JSON)
├── status (ENUM: RECEIVED, PROCESSING, PROCESSED, FAILED)
├── error_message (TEXT)
├── consumer_id (VARCHAR)
└── created_at (TIMESTAMP)

consumer_instances
├── id (VARCHAR - Primary Key)
├── status (ENUM: ACTIVE, INACTIVE)
├── hostname (VARCHAR)
├── port (INT)
├── pid (INT)
├── topic_name (VARCHAR)          # ✅ Topic đăng ký
├── last_heartbeat (TIMESTAMP)
├── should_stop (BOOLEAN)
└── is_deleted (BOOLEAN)
```

---

## 🔄 Message Flow

```
1. Producer (Frontend/API)
   ↓ POST /api/producers/send-single
   
2. Producer Service (NestJS)
   ↓ Write to producer_logs (status: PENDING)
   ↓ Send to Kafka
   ↓ Update status: SENT
   
3. Kafka Broker
   ↓ Store in topic partition
   
4. Consumer Service (KafkaJS)
   ↓ Subscribe to topic (from KAFKA_TOPIC_NAME)
   ↓ Receive message
   ↓ Write to consumer_logs (status: RECEIVED)
   ↓ Process message
   ↓ Update status: PROCESSING → PROCESSED/FAILED
   
5. WebSocket Real-time Updates
   ↓ Broadcast to Frontend
   
6. Frontend (Vue 3)
   ↓ Display in Dashboard/Logs
```

---

## 🎯 Consumer Topic Subscription Flow

### When Creating Consumer from UI:

```
1. User selects topic "test_failed" in AddConsumerModal
   ↓
2. Frontend calls: POST /api/admin/start-consumer
   {
     "consumerId": "consumer-2",
     "groupId": "platform-consumer-group-server",
     "topicName": "test_failed"  ✅
   }
   ↓
3. Admin Service spawns new consumer process:
   env: {
     CONSUMER_ID: "consumer-2",
     PORT: "3002",
     KAFKA_TOPIC_NAME: "test_failed",  ✅
     KAFKA_GROUP_ID: "platform-consumer-group-server"
   }
   ↓
4. Consumer Service starts and reads env vars:
   - Connects to Kafka
   - Subscribes to "test_failed" topic
   - Listens for messages
   ↓
5. When message arrives at "test_failed":
   - Consumer-2 receives and processes it ✅
   - Other consumers (on different topics) don't receive it ✅
```

---

## 📝 Environment Variables

### Producer Service (`.env`)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=admin
DB_DATABASE=kafka_platform

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=api-gateway-producer

# Server
PORT=3000
NODE_ENV=development
```

### Consumer Service (`.env`)
```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=kafka_platform

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=consumer-service
KAFKA_GROUP_ID=consumer-group-1
KAFKA_TOPIC_NAME=sales-data              # ✅ Default topic

# Server
PORT=3001
NODE_ENV=development

# Consumer Instance
CONSUMER_ID=                              # Auto-generated from hostname

# WebSocket
WEBSOCKET_PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`.env` - if exists)
```env
VITE_API_URL=http://localhost:3000
VITE_CONSUMER_WS_URL=http://localhost:3001
```

---

## 🚀 Running the Application

### 1. Start Infrastructure
```bash
cd realtime-data-platform
docker-compose up -d
```

### 2. Start Producer Service
```bash
cd backend/api-gateway-producer
npm install
npm run start:dev
```

### 3. Start Consumer Service (Manual - for default topic)
```bash
cd backend/consumer-service
npm install
npm run start:dev
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Create Additional Consumers (from UI)
- Open http://localhost:5173
- Navigate to "Consumer List"
- Click "Add Consumer"
- Select topic: `test_failed`
- Click "Create Consumer"
- → New consumer process spawns automatically with that topic

---

## 📚 Documentation Files

```
CONSUMER_API.md                      # Consumer API endpoints
CONSUMER_LOGS_GUIDE.md              # Consumer logs management
CONSUMER_RESUME_GUIDE.md            # Resume consumer instances
CONSUMER_SEARCH_PAGINATION_GUIDE.md # Search and pagination
CONSUMER_STOP_FIX_GUIDE.md          # Stop consumer fix
CONSUMER_UI_GUIDE.md                # Consumer UI guide
CONSUMER_TOPIC_SELECTION_GUIDE.md   # ✅ Topic selection guide (NEW)
DEBUG_GUIDE.md                      # Debugging guide
RESTART_KAFKA.md                    # Kafka restart guide
TOPIC_DELETE_FIX.md                 # Topic deletion issues
TOPIC_LIST_STATISTICS_UPDATE.md     # Topic statistics
TOPIC_MANAGEMENT_FEATURES.md        # Topic management
WEBSOCKET_REALTIME_GUIDE.md         # WebSocket real-time updates
WEBSOCKET_STATUS_REPORT.md          # WebSocket status
```

---

## 🔑 Key Features

### ✅ Implemented
- Multi-consumer support với topic riêng biệt
- Dynamic consumer creation từ UI
- Real-time WebSocket updates
- Producer statistics và dashboard
- Consumer statistics và dashboard
- Topic management (create, delete, update)
- CSV upload và batch processing
- Consumer health monitoring (heartbeat)
- Consumer instance management (stop, resume, delete)
- Pagination và search trong logs

### 🎯 Consumer Topic Selection (NEW)
- Mỗi consumer có thể subscribe vào topic riêng
- Topic được chọn khi tạo consumer từ UI
- Consumer chỉ nhận messages từ topic đã đăng ký
- Hỗ trợ nhiều topics cho 1 consumer (comma-separated)

---

## 🛠️ Technology Stack

### Backend
- **NestJS** - Node.js framework
- **KafkaJS** - Kafka client cho Node.js
- **TypeORM** - ORM cho PostgreSQL
- **PostgreSQL** - Database
- **Socket.IO** - WebSocket real-time communication

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Vite** - Build tool
- **Vue Router** - Routing
- **Pinia** - State management
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **Socket.IO Client** - WebSocket client

### Infrastructure
- **Apache Kafka** - Message broker
- **Zookeeper** - Kafka coordination
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

---

## 📞 API Endpoints Summary

### Producer API (`http://localhost:3000/api`)
```
POST   /producers/send-single           # Send single message
POST   /producers/send-batch            # Send batch messages
POST   /producers/upload-csv            # Upload CSV file
GET    /producers/statistics            # Get producer stats
GET    /producers/logs                  # Get producer logs

GET    /admin/topics                    # List all topics
POST   /admin/topics                    # Create new topic
DELETE /admin/topics/:name              # Delete topic
POST   /admin/start-consumer            # Create new consumer ✅
GET    /admin/consumers                 # List consumers
POST   /admin/stop-consumer/:id         # Stop consumer
```

### Consumer API (`http://localhost:3001/api`)
```
GET    /consumers/logs                  # Get consumer logs (with filters)
GET    /consumers/logs/:id              # Get log by ID
GET    /consumers/stats                 # Get consumer statistics
GET    /consumers/instances             # List consumer instances ✅
PUT    /consumers/instances/:id/stop    # Stop consumer instance
PUT    /consumers/instances/:id/resume  # Resume consumer instance
DELETE /consumers/instances/:id         # Delete consumer instance
```

---

## 🔍 Troubleshooting

### Consumer không nhận messages
1. Check `KAFKA_TOPIC_NAME` trong `.env` hoặc environment variable
2. Xem log: `[KafkaConsumer] 🎯 Consumer ... sẽ subscribe topics: ...`
3. Verify producer đã gửi messages đến đúng topic
4. Check consumer status: `GET /api/consumers/instances`

### Consumer bị duplicate messages
1. Kiểm tra `KAFKA_GROUP_ID` - consumers cùng group sẽ chia partition
2. Nếu muốn tất cả consumers nhận messages → Dùng group ID khác nhau

### Topic không thể xóa
1. Stop tất cả consumers đang subscribe topic đó
2. Wait 10-30 giây để Kafka cleanup
3. Thử xóa lại

---

Xem thêm chi tiết trong các file documentation đính kèm!
