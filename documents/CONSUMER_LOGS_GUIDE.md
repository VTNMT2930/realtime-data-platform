# Consumer Logs Guide 📋

## Giới thiệu

Consumer Logs là một tính năng mới được thêm vào Consumer Dashboard, hoàn toàn giống với Producer Logs về giao diện và chức năng. Tab này đã thay thế tab "Recent Activity" cũ để cung cấp khả năng quản lý và theo dõi logs chi tiết hơn.

## Tính năng chính

### 1. 🔍 Tìm kiếm Log theo ID

- **Mô tả**: Tìm kiếm nhanh một log cụ thể bằng Consumer Log ID
- **Cách sử dụng**:
  1. Nhập Log ID vào ô tìm kiếm
  2. Nhấn Enter hoặc click nút "Tìm kiếm"
  3. Nếu tìm thấy, modal chi tiết log sẽ hiện ra

### 2. 📊 Bảng danh sách Logs

Hiển thị tất cả consumer logs với các thông tin:

- **ID**: Consumer Log ID (8 ký tự đầu)
- **Status**: Trạng thái (RECEIVED, PROCESSING, PROCESSED, FAILED)
- **Topic**: Tên topic Kafka
- **Partition**: Số partition
- **Consumer ID**: ID của consumer xử lý message
- **Created**: Thời gian tạo log

#### Tính năng:

- **Scroll**: Bảng có chiều cao cố định 600px với thanh cuộn
- **Fixed Header**: Header cố định khi scroll
- **Hover Effect**: Highlight row khi di chuột qua

### 3. 🎯 Lọc theo trạng thái

Dropdown filter cho phép lọc logs theo status:

- **Tất cả trạng thái**: Hiển thị tất cả
- **RECEIVED**: Đã nhận từ Kafka
- **PROCESSING**: Đang xử lý
- **PROCESSED**: Xử lý thành công
- **FAILED**: Xử lý thất bại

### 4. 📄 Modal chi tiết Log

Khi click "View" hoặc tìm kiếm thành công, modal hiển thị:

#### Thông tin cơ bản:

- **ID**: Consumer Log ID đầy đủ
- **Original Log ID**: ID của Producer Log gốc
- **Status**: Trạng thái với màu sắc badge
- **Topic**: Tên topic
- **Partition**: Số partition
- **Offset**: Message offset
- **Consumer ID**: ID của consumer xử lý
- **Created At**: Thời gian tạo
- **Updated At**: Thời gian cập nhật

#### Error Message:

- Hiển thị thông báo lỗi nếu status là FAILED
- Box màu đỏ với icon cảnh báo

#### Data Content:

- Hiển thị nội dung JSON với syntax highlighting
- Có nút "Copy" để copy toàn bộ data vào clipboard
- Scrollable với max-height 400px

### 5. 🔄 Pagination

- Hiển thị thông tin phân trang ở cuối bảng
- Format: "Hiển thị X / Y logs (Trang A / B)"
- Mặc định: 50 logs/trang

### 6. 🔴 Realtime Updates (WebSocket)

Consumer Logs tự động cập nhật realtime qua WebSocket:

- **message-received**: Tự động refresh khi có message mới
- **processing-started**: Cập nhật status khi bắt đầu xử lý
- **processing-completed**: Cập nhật status khi hoàn thành
- **processing-failed**: Cập nhật status khi thất bại

## API Endpoints

### Backend (Consumer Service - Port 3001)

#### 1. Lấy danh sách logs với pagination

```http
GET /api/consumers/logs?page=1&limit=50&status=PROCESSED&topic=upfile
```

**Query Parameters:**

- `page` (optional): Số trang, default = 1
- `limit` (optional): Số logs/trang, default = 50
- `status` (optional): Filter theo status (RECEIVED, PROCESSING, PROCESSED, FAILED)
- `topic` (optional): Filter theo topic name
- `consumerId` (optional): Filter theo consumer ID

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "originalLogId": "producer-log-id",
      "topic": "upfile",
      "partition": 0,
      "offset": "123",
      "status": "PROCESSED",
      "consumerId": "consumer-1",
      "data": "...",
      "parsedData": {...},
      "createdAt": "2025-11-09T...",
      "updatedAt": "2025-11-09T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

#### 2. Lấy log chi tiết theo ID

```http
GET /api/consumers/logs/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "originalLogId": "producer-log-id",
    "topic": "upfile",
    "partition": 0,
    "offset": "123",
    "status": "PROCESSED",
    "consumerId": "consumer-1",
    "data": "...",
    "parsedData": {...},
    "errorMessage": null,
    "createdAt": "2025-11-09T...",
    "updatedAt": "2025-11-09T..."
  }
}
```

#### 3. Tìm log theo Original Log ID (Producer ID)

```http
GET /api/consumers/logs/search/:originalLogId
```

## Frontend Services

### Sử dụng trong Vue component

```javascript
import { getConsumerLogs, getConsumerLogById } from "@/services/apiService";

// Lấy danh sách logs
const response = await getConsumerLogs({
  page: 1,
  limit: 50,
  status: "PROCESSED",
  topic: "upfile",
});

// Lấy log chi tiết
const logDetail = await getConsumerLogById(logId);
```

## Status Colors

Consumer Logs sử dụng màu sắc giống Producer Logs:

- **RECEIVED** (Yellow): `bg-yellow-100 text-yellow-800`
- **PROCESSING** (Blue): `bg-blue-100 text-blue-800`
- **PROCESSED** (Green): `bg-green-100 text-green-800`
- **FAILED** (Red): `bg-red-100 text-red-800`

## Keyboard Shortcuts

- **Enter** trong ô tìm kiếm: Thực hiện tìm kiếm
- **ESC** khi mở modal: Đóng modal (coming soon)

## So sánh với Producer Logs

| Tính năng                 | Producer Logs | Consumer Logs |
| ------------------------- | ------------- | ------------- |
| Search by ID              | ✅            | ✅            |
| Filter by Status          | ✅ (Type)     | ✅ (Status)   |
| Pagination                | ✅            | ✅            |
| Fixed height table        | ✅            | ✅            |
| Modal detail              | ✅            | ✅            |
| Copy to clipboard         | ✅            | ✅            |
| Realtime updates          | ✅            | ✅            |
| Scrollable data preview   | ✅            | ✅            |
| Error message display     | ✅            | ✅            |
| Original Log ID reference | ❌            | ✅            |

## Lưu ý

1. **Kafka Metadata**: Consumer Logs lưu thêm thông tin về topic, partition, offset từ Kafka
2. **Original Log ID**: Mỗi consumer log có reference đến producer log gốc qua `originalLogId`
3. **Data Structure**: Data được lưu dưới dạng JSON string và tự động parse khi hiển thị
4. **WebSocket Connection**: Status indicator ở cuối trang hiển thị trạng thái kết nối WebSocket

## Troubleshooting

### Logs không hiển thị?

1. Kiểm tra Consumer Service đang chạy (port 3001)
2. Kiểm tra WebSocket connection status
3. Thử click nút "Refresh"

### Tìm kiếm không hoạt động?

1. Đảm bảo nhập đúng Consumer Log ID (UUID format)
2. Kiểm tra log có tồn tại trong database
3. Xem console log để debug

### Modal không đóng?

1. Click vào vùng tối phía ngoài modal
2. Click nút X ở góc phải trên
3. Refresh trang nếu bị stuck

## Future Enhancements

- [ ] Export logs to CSV/JSON
- [ ] Advanced filters (date range, multiple topics)
- [ ] Bulk operations
- [ ] Log statistics charts
- [ ] ESC key to close modal
- [ ] Load more pagination (infinite scroll)
