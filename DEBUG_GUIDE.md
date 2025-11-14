# 🔍 Hướng dẫn Debug Producer Logs

## Tổng quan

Tài liệu này giúp bạn debug và kiểm tra xem Producer có tạo log summary khi gửi message thành công tới Kafka hay không.

## Vấn đề đã giải quyết

- ✅ Thêm endpoint API để lấy log chi tiết theo ID
- ✅ Thêm logging chi tiết trong Producer service
- ✅ Tạo Debug View để kiểm tra logs dễ dàng
- ✅ Cải thiện message summary khi upload CSV file

## Cách sử dụng Debug View

### 1. Truy cập Debug View

Mở trình duyệt và truy cập:

```
http://localhost:5173/#/debug-logs
```

Hoặc click vào menu **"Debug Logs"** trên sidebar.

### 2. Xem tất cả logs

Debug view sẽ hiển thị tất cả logs với các thông tin:

- **ID**: Log ID (UUID)
- **Type**: SINGLE hoặc FILE
- **Status**: PENDING, PROCESSING, COMPLETED, FAILED
- **Topic**: Kafka topic đã gửi
- **File Name**: Tên file gốc (nếu là FILE type)
- **Created**: Thời gian tạo log

### 3. Tìm kiếm log theo ID

1. Copy Log ID từ bảng hoặc từ API response
2. Paste vào ô "Nhập Log ID..."
3. Click "Tìm kiếm" hoặc nhấn Enter

Kết quả sẽ hiển thị:

- Chi tiết đầy đủ của log
- Data đã được parse (JSON format)
- Error message (nếu có)

### 4. Filter logs

Sử dụng dropdown để filter:

- **Tất cả loại**: Hiển thị tất cả
- **Single**: Chỉ hiển thị single messages
- **File**: Chỉ hiển thị file uploads

## Kiểm tra Log Summary khi Upload CSV

### Bước 1: Upload file CSV

1. Truy cập Configuration > Topics
2. Click vào một topic
3. Click "Produce Message" > Tab "Upload File"
4. Chọn file CSV và upload

### Bước 2: Xem logs trong terminal

Producer terminal sẽ hiển thị:

```bash
Controller: Đang tạo log cho file: test.csv Topic: upfile
Controller: ✅ Đã tạo LOG SUMMARY ban đầu (ID: abc-123-def)
Controller: Thêm job vào queue với logId: abc-123-def, Topic: upfile

[Worker] Bắt đầu xử lý file: ./uploads/... (Log ID: abc-123-def, Topic: upfile)
[Worker] Gửi batch 1: 100 records tới topic "upfile" (Log ID: abc-123-def)...
[Worker] Gửi batch 2: 100 records tới topic "upfile" (Log ID: abc-123-def)...
...
[Worker] Đã xử lý VÀ GỬI KAFKA xong file CSV tới topic "upfile": ... - Total: 250 records in 3 batches
[Worker] ✅ ĐÃ CẬP NHẬT LOG SUMMARY (ID: abc-123-def): {
  totalRecords: 250,
  totalBatches: 3,
  message: "Đã gửi thành công 250 records trong 3 batches tới Kafka topic: upfile",
  topic: "upfile"
}
```

### Bước 3: Kiểm tra trong Debug View

1. Truy cập Debug View
2. Copy Log ID từ terminal (ví dụ: `abc-123-def`)
3. Tìm kiếm log theo ID
4. Xác nhận thông tin:
   - Status = COMPLETED
   - Data chứa: totalRecords, totalBatches, message

## API Endpoints mới

### 1. Lấy log theo ID

```http
GET /api/producers/logs/:id
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "abc-123-def",
    "type": "FILE",
    "status": "COMPLETED",
    "topic": "upfile",
    "originalFileName": "test.csv",
    "createdAt": "2025-11-02T10:00:00.000Z",
    "updatedAt": "2025-11-02T10:00:05.000Z",
    "data": "{\"totalRecords\":250,\"totalBatches\":3,...}",
    "parsedData": {
      "totalRecords": 250,
      "totalBatches": 3,
      "message": "Đã gửi thành công 250 records trong 3 batches tới Kafka topic: upfile",
      "topic": "upfile"
    }
  }
}
```

### 2. Lấy danh sách logs (đã có, cải tiến)

```http
GET /api/producers/logs?page=1&limit=50&type=FILE&topic=upfile
```

## Troubleshooting

### Vấn đề: Không thấy log summary

**Nguyên nhân có thể:**

1. Worker chưa xử lý xong file
2. Log ID không đúng
3. Database connection issue

**Cách kiểm tra:**

1. Xem terminal logs của Producer
2. Kiểm tra status của log (có thể còn PROCESSING)
3. Đợi vài giây và refresh lại

### Vấn đề: Data field là null hoặc rỗng

**Nguyên nhân:**

- Lỗi khi parse CSV
- File upload bị corrupt

**Cách kiểm tra:**

1. Xem `errorMessage` field
2. Check terminal logs để xem lỗi chi tiết

### Vấn đề: Frontend không hiển thị logs

**Nguyên nhân:**

- API endpoint không trả về đúng format
- CORS issue
- Network error

**Cách kiểm tra:**

1. Mở DevTools > Network tab
2. Xem API response
3. Check console logs

## Lưu ý quan trọng

### Log Summary vs Batch Logs

- **Log Summary**: Log chính của file upload, chứa tổng hợp (totalRecords, totalBatches)

  - `originalFileName`: Tên file gốc (ví dụ: "test.csv")
  - `type`: FILE
  - `data`: JSON với summary info

- **Batch Logs**: Logs cho từng batch riêng lẻ (không hiển thị trong file uploads)
  - `originalFileName`: "Batch 1", "Batch 2", etc.
  - `type`: FILE
  - `data`: Array các records trong batch

### Status Flow

1. **PENDING**: Log vừa được tạo, đang chờ xử lý
2. **PROCESSING**: Worker đang xử lý file
3. **COMPLETED**: Đã gửi thành công tất cả batches tới Kafka
4. **FAILED**: Có lỗi trong quá trình xử lý

## Testing Script

Để test nhanh, bạn có thể dùng curl:

```bash
# Lấy tất cả logs
curl http://localhost:3000/api/producers/logs

# Lấy log theo ID
curl http://localhost:3000/api/producers/logs/YOUR_LOG_ID

# Lấy file uploads only
curl http://localhost:3000/api/producers/uploads
```

## Kết luận

Với các công cụ debug mới này, bạn có thể:

- ✅ Xác nhận Producer đã tạo log summary
- ✅ Kiểm tra chi tiết data trong log
- ✅ Debug các vấn đề về upload file
- ✅ Trace logs từ Producer sang Consumer

Nếu vẫn gặp vấn đề, hãy:

1. Check terminal logs của cả Producer và Consumer
2. Xem database trực tiếp
3. Kiểm tra Kafka broker logs
