# Consumer Resume Feature Guide

## Tổng quan

Tính năng Resume Consumer cho phép người dùng tiếp tục chạy một consumer đã bị dừng (INACTIVE) mà không cần tạo mới hoàn toàn.

## Các trạng thái Consumer

| Trạng thái | Mô tả | UI Display | Actions Available |
|------------|--------|------------|-------------------|
| `ACTIVE` | Consumer đang chạy và xử lý messages | 🟢 Active | Stop, Delete |
| `INACTIVE` | Consumer đã dừng hoặc mất kết nối | 🔴 Inactive | Resume, Delete |

## Cách hoạt động

### 1. Stop Consumer
- Chuyển trạng thái từ `ACTIVE` → `INACTIVE`
- Consumer instance vẫn còn trong database
- Không xóa dữ liệu đã xử lý
- Có thể resume lại sau

### 2. Resume Consumer
- Chuyển trạng thái từ `INACTIVE` → `ACTIVE`
- Cập nhật `lastHeartbeat` để đánh dấu consumer đang hoạt động
- Consumer sẽ tiếp tục nhận và xử lý messages mới
- Broadcast sự kiện qua WebSocket để cập nhật UI real-time

### 3. Delete Consumer
- Xóa hoàn toàn consumer instance khỏi database
- Không thể khôi phục được
- Dữ liệu logs đã xử lý vẫn được giữ lại

## API Endpoints

### Backend API (Consumer Service - Port 3001)

```http
# Resume Consumer
PUT /api/consumers/instances/:consumerId/resume

# Stop Consumer  
PUT /api/consumers/instances/:consumerId/stop

# Delete Consumer
DELETE /api/consumers/instances/:consumerId
```

### Frontend API Calls

```javascript
// Resume consumer
import { resumeConsumer } from '@/services/apiService';
const response = await resumeConsumer(consumerId);

// Stop consumer
import { stopConsumer } from '@/services/apiService';
const response = await stopConsumer(consumerId);

// Delete consumer
import { deleteConsumer } from '@/services/apiService';
const response = await deleteConsumer(consumerId);
```

## WebSocket Events

### Từ Backend → Frontend

```javascript
// Khi consumer được resumed
socket.on('consumer-resumed', (data) => {
  // data: { consumerId, status: "ACTIVE", timestamp }
});

// Khi consumer được stopped
socket.on('consumer-stopped', (data) => {
  // data: { consumerId, status: "INACTIVE", timestamp }
});

// Khi consumer được deleted
socket.on('consumer-deleted', (data) => {
  // data: { consumerId, timestamp }
});
```

## UI/UX

### Consumer Card Actions

#### Active Consumer
```
┌─────────────────────────────┐
│ 🟢 CONSUMER-NAME           │
│ ● Active                   │
│ ─────────────────────────── │
│ PID: 12345                 │
│ Group: default             │
│ ─────────────────────────── │
│ [Stop] [Delete]            │
└─────────────────────────────┘
```

#### Inactive Consumer
```
┌─────────────────────────────┐
│ 🔴 CONSUMER-NAME           │
│ ● Inactive                 │
│ ─────────────────────────── │
│ PID: 12345                 │
│ Group: default             │
│ ─────────────────────────── │
│ [Resume] [Delete]          │
│ ⚠️ Consumer is inactive     │
│ Click "Resume" to reactivate│
└─────────────────────────────┘
```

### Confirmation Dialogs

#### Stop Consumer
```
Are you sure you want to STOP consumer "CONSUMER-NAME"?

The consumer will be marked as INACTIVE but record 
will remain in database.

[Cancel] [Stop]
```

#### Resume Consumer
```
Are you sure you want to RESUME consumer "CONSUMER-NAME"?

The consumer will be marked as ACTIVE and start 
processing messages again.

[Cancel] [Resume]
```

#### Delete Consumer
```
Are you sure you want to DELETE consumer "CONSUMER-NAME"?

⚠️ This will PERMANENTLY remove the consumer from database!

[Cancel] [Delete]
```

## Lưu ý quan trọng

### 1. Resume vs Create New
- **Resume**: Giữ nguyên consumer ID và lịch sử xử lý
- **Create New**: Tạo consumer mới hoàn toàn với ID khác

### 2. Heartbeat Mechanism
- Consumer gửi heartbeat mỗi 5 giây
- Nếu không có heartbeat trong 15 giây → tự động chuyển thành INACTIVE
- Resume sẽ reset lại heartbeat timestamp

### 3. Real-time Updates
- Tất cả thay đổi trạng thái được broadcast qua WebSocket
- UI tự động cập nhật mà không cần refresh trang
- Statistics (active/total consumers) được cập nhật real-time

### 4. Error Handling
- API calls có retry mechanism
- Loading states hiển thị trong thời gian processing
- Error messages được hiển thị rõ ràng cho user

## Troubleshooting

### Consumer không Resume được
1. Kiểm tra consumer có tồn tại trong database không
2. Đảm bảo consumer đang ở trạng thái INACTIVE
3. Kiểm tra kết nối WebSocket
4. Xem logs trong browser console

### UI không cập nhật sau Resume
1. Kiểm tra WebSocket connection status
2. Refresh trang nếu cần thiết
3. Kiểm tra network logs để đảm bảo API call thành công

## Tương lai

### Planned Features
- [ ] Bulk resume/stop multiple consumers
- [ ] Consumer health monitoring dashboard
- [ ] Auto-resume failed consumers
- [ ] Consumer performance metrics
- [ ] Consumer load balancing configuration