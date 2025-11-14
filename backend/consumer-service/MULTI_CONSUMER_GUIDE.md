# 🚀 Multi-Consumer Testing Guide

Hướng dẫn chạy nhiều consumer instances để test chức năng tracking.

## 📋 Prerequisites

- Node.js đã cài đặt
- Đã chạy `npm install` trong thư mục consumer-service
- Kafka, Zookeeper, Redis đang chạy (via docker-compose)

---

## 🎯 Cách 1: Sử dụng PowerShell Script (Khuyến nghị)

### Start nhiều consumers:

```powershell
# Chạy 2 consumers (mặc định)
.\start-multiple-consumers.ps1

# Chạy 3 consumers
.\start-multiple-consumers.ps1 -NumInstances 3

# Chạy 5 consumers
.\start-multiple-consumers.ps1 -NumInstances 5
```

### Stop tất cả consumers:

```powershell
.\stop-consumers.ps1
```

### Kiểm tra:

- Mở Dashboard: http://localhost:5173
- Consumer card sẽ hiển thị: `Active: 2/2` (hoặc 3/3, 5/5...)

---

## 🎯 Cách 2: Sử dụng Batch File

### Start nhiều consumers:

```batch
REM Chạy 2 consumers (mặc định)
start-consumers.bat

REM Chạy 3 consumers
start-consumers.bat 3

REM Chạy 5 consumers
start-consumers.bat 5
```

### Stop consumers:

- Đóng từng cửa sổ console
- Hoặc nhấn Ctrl+C trong mỗi cửa sổ

---

## 🎯 Cách 3: Manual (Chạy từng instance thủ công)

### Terminal 1 - Consumer 1:

```powershell
cd backend/consumer-service
$env:CONSUMER_ID="consumer-1"
$env:PORT=3001
npm run start:dev
```

### Terminal 2 - Consumer 2:

```powershell
cd backend/consumer-service
$env:CONSUMER_ID="consumer-2"
$env:PORT=3002
npm run start:dev
```

### Terminal 3 - Consumer 3:

```powershell
cd backend/consumer-service
$env:CONSUMER_ID="consumer-3"
$env:PORT=3003
npm run start:dev
```

---

## 🧪 Test Scenarios

### Scenario 1: Tất cả consumers hoạt động

1. Start 3 consumers
2. Kiểm tra Dashboard
3. Kết quả: `Active: 3/3` ✅

### Scenario 2: 1 consumer bị chết

1. Start 3 consumers
2. Stop 1 consumer (Ctrl+C hoặc đóng window)
3. Đợi 30 giây (heartbeat timeout)
4. Kiểm tra Dashboard
5. Kết quả: `Active: 2/3` ⚠️

### Scenario 3: Consumer recovery

1. Start 3 consumers
2. Stop 1 consumer
3. Đợi 30 giây (Dashboard hiển thị 2/3)
4. Start lại consumer đó
5. Đợi 10 giây (heartbeat interval)
6. Kết quả: `Active: 3/3` ✅

---

## 📊 Monitoring

### Console Logs

Mỗi consumer sẽ log:

```
[Consumer] Khởi tạo với ID: consumer-1
[Consumer] Registered instance: consumer-1
```

### Dashboard

- Consumer card: `Active: X/Y`
  - X = số consumers đang hoạt động
  - Y = tổng số consumers đã đăng ký

### Heartbeat Logic

- ⏱️ Heartbeat interval: 10 giây
- ⏱️ Timeout: 30 giây
- Sau 30 giây không heartbeat → marked as `inactive`

---

## 🔧 Configuration

### Environment Variables

| Variable        | Description                     | Default          |
| --------------- | ------------------------------- | ---------------- |
| `CONSUMER_ID`   | Unique ID cho consumer instance | `hostname()`     |
| `PORT`          | Port cho HTTP server            | `3001`           |
| `DATABASE_HOST` | PostgreSQL host                 | `localhost`      |
| `KAFKA_BROKER`  | Kafka broker                    | `localhost:9092` |

### Ports được sử dụng

| Service    | Port |
| ---------- | ---- |
| Consumer 1 | 3001 |
| Consumer 2 | 3002 |
| Consumer 3 | 3003 |
| Consumer 4 | 3004 |
| ...        | ...  |

---

## ⚠️ Troubleshooting

### Problem: Consumers không được track

**Solution:**

- Kiểm tra console logs xem có message `[Consumer] Registered instance: consumer-X`
- Kiểm tra heartbeat có chạy không

### Problem: Dashboard vẫn hiển thị 0/0

**Solution:**

- Restart frontend: `npm run dev` trong thư mục frontend
- Kiểm tra API endpoint: `http://localhost:3001/consumers/stats`

### Problem: Consumer bị inactive ngay lập tức

**Solution:**

- Kiểm tra heartbeat interval có chạy không
- Đảm bảo không có lỗi trong consumer service

---

## 📝 Notes

- Mỗi consumer instance cần CONSUMER_ID unique
- Consumer instances share cùng database và Kafka cluster
- Các consumers sẽ tự động balance load khi consume messages
- Static Map trong memory → data không persist khi restart

---

## 🎉 Kết luận

Với setup này, bạn có thể:

- ✅ Test load balancing với nhiều consumers
- ✅ Monitor consumer health realtime
- ✅ Test failure scenarios
- ✅ Demo high availability

Chúc bạn test vui vẻ! 🚀
