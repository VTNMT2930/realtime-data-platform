# 🔌 WebSocket Events Documentation

## Connection Information

**WebSocket URL:** `http://localhost:3001`

**CORS:** Enabled for all origins (⚠️ Change in production!)

**Transports:** WebSocket, Polling (fallback)

---

## 📡 Available Events

### 1. `connection-success`

Được emit ngay sau khi client kết nối thành công.

**Trigger:** Client establishes connection

**Data Structure:**

```typescript
{
  message: string; // "Connected to Consumer Service WebSocket"
  timestamp: string; // ISO 8601 format
}
```

**Example:**

```json
{
  "message": "Connected to Consumer Service WebSocket",
  "timestamp": "2025-11-01T10:30:45.123Z"
}
```

---

### 2. `message-received` 📥

Được emit khi Consumer Service nhận được message từ Kafka.

**Trigger:** New message arrives from Kafka topic

**Data Structure:**

```typescript
{
  logId: string;          // Original log ID from Producer
  data: {
    dataType: "CSV_BATCH" | "SINGLE_MESSAGE";
    rowCount?: number;    // Only present for CSV_BATCH
  };
  timestamp: string;      // ISO 8601 format
}
```

**Example - Single Message:**

```json
{
  "logId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "dataType": "SINGLE_MESSAGE"
  },
  "timestamp": "2025-11-01T10:30:45.123Z"
}
```

**Example - CSV Batch:**

```json
{
  "logId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "dataType": "CSV_BATCH",
    "rowCount": 100
  },
  "timestamp": "2025-11-01T10:30:45.123Z"
}
```

---

### 3. `processing-started` ⚙️

Được emit khi Consumer bắt đầu xử lý message.

**Trigger:** Status changes to PROCESSING

**Data Structure:**

```typescript
{
  logId: string; // Original log ID
  status: "PROCESSING"; // Always "PROCESSING"
  timestamp: string; // ISO 8601 format
}
```

**Example:**

```json
{
  "logId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING",
  "timestamp": "2025-11-01T10:30:45.500Z"
}
```

---

### 4. `processing-completed` ✅

Được emit khi Consumer xử lý message thành công.

**Trigger:** Processing completes successfully

**Data Structure:**

```typescript
{
  logId: string; // Original log ID
  consumerId: string; // ID of the consumer instance
  status: "PROCESSED"; // Always "PROCESSED"
  timestamp: string; // ISO 8601 format
}
```

**Example:**

```json
{
  "logId": "550e8400-e29b-41d4-a716-446655440000",
  "consumerId": "consumer-instance-1",
  "status": "PROCESSED",
  "timestamp": "2025-11-01T10:30:47.600Z"
}
```

---

### 5. `processing-failed` ❌

Được emit khi có lỗi xảy ra trong quá trình xử lý.

**Trigger:** Error during processing

**Data Structure:**

```typescript
{
  logId: string; // Original log ID
  status: "FAILED"; // Always "FAILED"
  error: string; // Error message
  timestamp: string; // ISO 8601 format
}
```

**Example:**

```json
{
  "logId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "FAILED",
  "error": "Database connection timeout",
  "timestamp": "2025-11-01T10:30:48.000Z"
}
```

---

### 6. `stats-updated` 📊

Được emit khi có cập nhật thống kê (future feature).

**Trigger:** Manual stats update

**Data Structure:**

```typescript
{
  [key: string]: any;     // Dynamic statistics data
  timestamp: string;      // ISO 8601 format
}
```

---

## 🎨 Frontend Implementation Guide (Vue3 + Socket.io)

### Installation

```bash
npm install socket.io-client
```

### Basic Setup

```vue
<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

const socket = ref(null);
const isConnected = ref(false);
const events = ref([]);

onMounted(() => {
  // Connect to WebSocket server
  socket.value = io("http://localhost:3001", {
    transports: ["websocket", "polling"],
  });

  // Connection events
  socket.value.on("connect", () => {
    console.log("✅ Connected");
    isConnected.value = true;
  });

  socket.value.on("disconnect", () => {
    console.log("❌ Disconnected");
    isConnected.value = false;
  });

  // Listen to events
  socket.value.on("connection-success", (data) => {
    console.log("🎉 Connection Success:", data);
  });

  socket.value.on("message-received", (data) => {
    console.log("📥 Message Received:", data);
    events.value.unshift({
      type: "received",
      ...data,
    });
  });

  socket.value.on("processing-started", (data) => {
    console.log("⚙️ Processing Started:", data);
    updateEventStatus(data.logId, "processing");
  });

  socket.value.on("processing-completed", (data) => {
    console.log("✅ Processing Completed:", data);
    updateEventStatus(data.logId, "completed");
  });

  socket.value.on("processing-failed", (data) => {
    console.log("❌ Processing Failed:", data);
    updateEventStatus(data.logId, "failed", data.error);
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});

function updateEventStatus(logId, status, error = null) {
  const event = events.value.find((e) => e.logId === logId);
  if (event) {
    event.status = status;
    if (error) event.error = error;
  }
}
</script>

<template>
  <div>
    <div class="status">
      <span v-if="isConnected" class="connected">🟢 Connected</span>
      <span v-else class="disconnected">⚫ Disconnected</span>
    </div>

    <div class="events">
      <div
        v-for="event in events"
        :key="event.logId"
        :class="['event', event.status]"
      >
        <h3>{{ event.logId }}</h3>
        <p>Status: {{ event.status }}</p>
        <p v-if="event.error">Error: {{ event.error }}</p>
      </div>
    </div>
  </div>
</template>
```

---

## 🔥 Use Cases

### 1. Real-time Progress Bar (CSV Upload)

```vue
<script setup>
import { ref, computed } from "vue";

const totalBatches = ref(0);
const processedBatches = ref(0);

const progress = computed(() => {
  if (totalBatches.value === 0) return 0;
  return (processedBatches.value / totalBatches.value) * 100;
});

socket.value.on("message-received", (data) => {
  if (data.data.dataType === "CSV_BATCH") {
    totalBatches.value++;
  }
});

socket.value.on("processing-completed", () => {
  processedBatches.value++;
});
</script>

<template>
  <div class="progress-bar">
    <div class="progress" :style="{ width: progress + '%' }">
      {{ Math.round(progress) }}%
    </div>
  </div>
</template>
```

### 2. Live Dashboard

```vue
<script setup>
const stats = ref({
  received: 0,
  processing: 0,
  completed: 0,
  failed: 0,
});

socket.value.on("message-received", () => stats.value.received++);
socket.value.on("processing-started", () => stats.value.processing++);
socket.value.on("processing-completed", () => {
  stats.value.processing--;
  stats.value.completed++;
});
socket.value.on("processing-failed", () => {
  stats.value.processing--;
  stats.value.failed++;
});
</script>

<template>
  <div class="dashboard">
    <div class="stat-card">
      <h3>Received</h3>
      <p>{{ stats.received }}</p>
    </div>
    <div class="stat-card">
      <h3>Processing</h3>
      <p>{{ stats.processing }}</p>
    </div>
    <div class="stat-card">
      <h3>Completed</h3>
      <p>{{ stats.completed }}</p>
    </div>
    <div class="stat-card">
      <h3>Failed</h3>
      <p>{{ stats.failed }}</p>
    </div>
  </div>
</template>
```

### 3. Toast Notifications

```vue
<script setup>
import { useToast } from "vue-toastification"; // or your toast library

const toast = useToast();

socket.value.on("processing-completed", (data) => {
  toast.success(`Message ${data.logId} processed successfully!`);
});

socket.value.on("processing-failed", (data) => {
  toast.error(`Failed to process ${data.logId}: ${data.error}`);
});
</script>
```

---

## 🧪 Testing

### Using the HTML Test Client

1. Open `websocket-test.html` in your browser
2. Click "Connect" button
3. Open another terminal and send test messages via REST API:

```bash
# Send single message
curl -X POST http://localhost:3000/producers/send/single \
  -H "Content-Type: application/json" \
  -d '{"orderNumber":"TEST-001","productName":"Test Product","quantity":10,"price":100}'

# Upload CSV
curl -X POST http://localhost:3000/producers/upload/csv \
  -F "file=@test-data.csv"
```

4. Watch events appear in real-time!

### Using Postman

1. Create new WebSocket request
2. URL: `ws://localhost:3001/socket.io/?EIO=4&transport=websocket`
3. Connect and monitor messages

---

## 🚨 Important Notes

### For Backend Developer (You):

- ✅ WebSocket Gateway is already implemented
- ✅ Events are automatically emitted during message processing
- ✅ CORS is enabled for all origins
- ⚠️ Remember to configure CORS properly in production!

### For Frontend Developer:

- Install `socket.io-client` package
- Connect to `http://localhost:3001`
- Listen to events listed above
- Update UI based on real-time events
- Handle reconnection logic for better UX

---

## 🔧 Configuration (Production)

Update `consumers.gateway.ts` for production:

```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://your-frontend-domain.com'], // Specific domains
    credentials: true,
  },
})
```

---

## 📞 Support

If you have questions about WebSocket implementation:

- Check the HTML test client for reference
- Review the Gateway code in `consumers.gateway.ts`
- Test events using the provided HTML file

---

**Last Updated:** November 1, 2025
