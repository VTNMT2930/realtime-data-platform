# 🎮 Consumer Management API

API để quản lý Consumer instances từ UI hoặc scripts.

## 📋 Endpoints

### 1. Tạo Consumer Mới

**POST** `/api/admin/consumers`

Tạo một consumer instance mới. Port sẽ tự động tăng dần từ 3001.

**Request Body:**

```json
{
  "consumerId": "consumer-custom-name", // Optional, auto-generate nếu không truyền
  "groupId": "my-consumer-group" // Optional, default: platform-consumer-group-server
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Consumer consumer-custom-name đã được khởi động",
  "data": {
    "consumerId": "consumer-custom-name",
    "pid": 12345,
    "groupId": "my-consumer-group"
  }
}
```

**Ví dụ:**

```bash
# Tạo consumer với tên tự động
curl -X POST http://localhost:3000/api/admin/consumers \
  -H "Content-Type: application/json" \
  -d '{}'

# Tạo consumer với tên custom
curl -X POST http://localhost:3000/api/admin/consumers \
  -H "Content-Type: application/json" \
  -d '{"consumerId": "consumer-analytics", "groupId": "analytics-group"}'
```

---

### 2. Lấy Danh Sách Consumers Đang Chạy

**GET** `/api/admin/consumers`

Lấy danh sách tất cả consumer instances đang được quản lý bởi API gateway.

**Response:**

```json
{
  "status": "success",
  "data": [
    {
      "pid": 12345,
      "consumerId": "consumer-1",
      "groupId": "platform-consumer-group-server",
      "startedAt": "2025-11-03T14:30:00.000Z"
    },
    {
      "pid": 12346,
      "consumerId": "consumer-2",
      "groupId": "platform-consumer-group-server",
      "startedAt": "2025-11-03T14:30:05.000Z"
    }
  ]
}
```

**Ví dụ:**

```bash
curl http://localhost:3000/api/admin/consumers
```

---

### 3. Stop Consumer

**DELETE** `/api/admin/consumers/:consumerId`

Dừng một consumer instance cụ thể.

**Response:**

```json
{
  "status": "success",
  "message": "Consumer consumer-1 đã được dừng"
}
```

**Ví dụ:**

```bash
curl -X DELETE http://localhost:3000/api/admin/consumers/consumer-1
```

---

## 🚀 Sử dụng từ Frontend

### Tạo Consumer từ UI

```javascript
// Frontend Vue.js example
async function createConsumer() {
  try {
    const response = await fetch("http://localhost:3000/api/admin/consumers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        consumerId: `consumer-${Date.now()}`, // Hoặc để trống để auto-generate
      }),
    });

    const result = await response.json();
    console.log("Consumer created:", result);

    // Refresh dashboard sau 10 giây để thấy consumer mới
    setTimeout(() => {
      this.fetchStatistics();
    }, 10000);
  } catch (error) {
    console.error("Error creating consumer:", error);
  }
}
```

### Lấy Danh Sách Consumers

```javascript
async function getConsumers() {
  try {
    const response = await fetch("http://localhost:3000/api/admin/consumers");
    const result = await response.json();

    console.log("Running consumers:", result.data);
    return result.data;
  } catch (error) {
    console.error("Error fetching consumers:", error);
  }
}
```

### Stop Consumer

```javascript
async function stopConsumer(consumerId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/admin/consumers/${consumerId}`,
      { method: "DELETE" }
    );

    const result = await response.json();
    console.log("Consumer stopped:", result);
  } catch (error) {
    console.error("Error stopping consumer:", error);
  }
}
```

---

## ⚙️ Cách Hoạt Động

1. **Auto Port Assignment:**

   - Consumer đầu tiên: Port 3001
   - Consumer thứ hai: Port 3002
   - Consumer thứ ba: Port 3003
   - Và cứ thế tự động tăng...

2. **Process Management:**

   - API Gateway spawn consumer processes độc lập
   - Mỗi consumer chạy trong process riêng
   - Consumer tự động register vào database tracking
   - Heartbeat mỗi 10 giây để báo cáo trạng thái

3. **Monitoring:**
   - Dashboard tự động phát hiện consumers mới sau 10 giây
   - Hiển thị Active: X/Y (X = active, Y = total)
   - Consumer inactive sau 30 giây không heartbeat

---

## 📊 Flow Diagram

```
UI Button "Create Consumer"
    ↓
POST /api/admin/consumers
    ↓
API Gateway spawns new process
    ↓
Consumer starts with auto port (3001, 3002, ...)
    ↓
Consumer registers in database
    ↓
Heartbeat every 10s
    ↓
Dashboard shows Active: X/Y
```

---

## 🔧 Environment Variables

Các biến môi trường được set tự động khi spawn consumer:

| Variable         | Description               | Auto-Set                 |
| ---------------- | ------------------------- | ------------------------ |
| `CONSUMER_ID`    | Unique consumer ID        | ✅                       |
| `PORT`           | HTTP port (auto từ 3001+) | ❌ (auto-assigned)       |
| `KAFKA_GROUP_ID` | Consumer group            | ✅ (default hoặc custom) |

---

## ⚠️ Lưu Ý

1. **Port Conflict:**

   - Nếu port đang được sử dụng, consumer tự động thử port tiếp theo
   - Tối đa thử 20 ports

2. **Process Tracking:**

   - API Gateway chỉ track consumers được tạo qua API
   - Consumers được start manual không xuất hiện trong danh sách

3. **Cleanup:**

   - Khi API Gateway restart, sẽ mất track các consumer processes
   - Nên dùng scripts hoặc Docker cho production

4. **Scaling:**
   - Để scale nhiều consumers, nên dùng Docker Compose
   - API này phù hợp cho development và demo

---

## 🎯 Next Steps

1. **Tích hợp vào UI:**

   - Thêm button "Add Consumer" trong Dashboard
   - Hiển thị danh sách consumers với status
   - Button "Stop" cho từng consumer

2. **Monitoring:**

   - Real-time consumer health check
   - CPU/Memory usage per consumer
   - Message throughput per consumer

3. **Auto Scaling:**
   - Tự động tạo consumer khi load cao
   - Tự động stop consumer khi load thấp

---

Chúc bạn code vui vẻ! 🚀
