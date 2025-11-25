# Chức năng Xóa và Sửa Topic

## 📋 Tổng quan

Đã thêm 2 chức năng mới cho quản lý Kafka Topics:

1. **Xóa Topic** - Xóa topic và tất cả messages
2. **Sửa cấu hình Topic** - Cập nhật partitions và các cấu hình khác

---

## 🔧 Backend APIs

### 1. Xóa Topic

```
DELETE /api/admin/topics/:topicName
```

**Response:**

```json
{
  "status": "success",
  "message": "Topic <topicName> đã được xóa thành công."
}
```

### 2. Cập nhật Topic

```
PATCH /api/admin/topics/:topicName
```

**Request Body:**

```json
{
  "numPartitions": 5, // Optional: Tăng số partition
  "configs": {
    // Optional: Cấu hình topic
    "retention.ms": "604800000", // 7 ngày
    "compression.type": "gzip",
    "max.message.bytes": "1048576", // 1MB
    "min.insync.replicas": "1"
  }
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Topic <topicName> đã được cập nhật thành công."
}
```

### 3. Lấy chi tiết Topic

```
GET /api/admin/topics/:topicName
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "metadata": {
      "name": "topic-name",
      "partitions": [...]
    },
    "configs": [
      { "name": "retention.ms", "value": "604800000" },
      ...
    ]
  }
}
```

---

## 🎨 Frontend Components

### 1. UpdateTopicModal.vue

Modal để cập nhật cấu hình topic với các tùy chọn:

- **Tăng số Partitions** (không thể giảm)
- **Retention Time** (thời gian lưu trữ)
- **Compression Type** (gzip, snappy, lz4, zstd)
- **Max Message Size** (kích thước tối đa)
- **Min In-Sync Replicas** (số replicas đồng bộ tối thiểu)

### 2. DeleteTopicModal.vue

Modal xác nhận xóa topic với:

- Cảnh báo nguy hiểm
- Yêu cầu nhập tên topic để xác nhận
- Không thể hoàn tác

---

## 📍 Vị trí chức năng

### TopicListView (Danh sách Topics)

- Cột "Actions" mới với 2 nút:
  - 🔵 **Nút Sửa** (icon bút)
  - 🔴 **Nút Xóa** (icon thùng rác)

### TopicDetailView (Chi tiết Topic)

- Header có 3 nút:
  - 🔵 **Cấu hình** - Mở modal sửa
  - 🔴 **Xóa Topic** - Mở modal xác nhận xóa
  - 🟢 **Produce Message** - Gửi message (có sẵn)

---

## ⚙️ Cách sử dụng

### Xóa Topic

1. Vào trang **Configuration > Topics**
2. Tìm topic muốn xóa
3. Click nút **Xóa** (icon thùng rác màu đỏ)
4. Nhập tên topic để xác nhận
5. Click **Xóa Topic**

**⚠️ Lưu ý:** Hành động này không thể hoàn tác!

### Sửa cấu hình Topic

1. Vào trang **Configuration > Topics**
2. Tìm topic muốn sửa
3. Click nút **Sửa** (icon bút màu xanh)
4. Điều chỉnh các cấu hình:
   - Tăng số partitions (nếu cần)
   - Thay đổi thời gian lưu trữ
   - Chọn kiểu nén
   - Điều chỉnh kích thước message tối đa
5. Click **Cập nhật**

**⚠️ Lưu ý:**

- Chỉ có thể **tăng** số partition, không thể giảm
- Để trống các trường không muốn thay đổi
- Phải có ít nhất 1 thay đổi để lưu

---

## 🔍 Validation

### Backend

- Kiểm tra topic có tồn tại không
- Không cho phép giảm số partitions
- Validate format của configs

### Frontend

- Kiểm tra tên topic khi xóa (phải khớp chính xác)
- Không cho nhập số partitions nhỏ hơn hiện tại
- Phải có ít nhất 1 thay đổi khi cập nhật

---

## 📦 Files đã thêm/sửa

### Backend

```
backend/api-gateway-producer/src/admin/
  ├── dto/
  │   └── update-topic.dto.ts          [NEW]
  ├── admin.controller.ts               [UPDATED]
  └── admin.service.ts                  [UPDATED]
```

### Frontend

```
frontend/src/
  ├── components/common/
  │   ├── UpdateTopicModal.vue         [NEW]
  │   └── DeleteTopicModal.vue         [NEW]
  ├── services/
  │   └── apiService.js                [UPDATED]
  ├── stores/
  │   └── kafkaStore.js                [UPDATED]
  └── views/
      ├── TopicListView.vue            [UPDATED]
      └── TopicDetailView.vue          [UPDATED]
```

---

## 🧪 Testing

### Test Xóa Topic

```bash
# 1. Tạo topic test
curl -X POST http://localhost:3000/api/admin/topics \
  -H "Content-Type: application/json" \
  -d '{
    "topicName": "test-delete",
    "numPartitions": 3,
    "replicationFactor": 1
  }'

# 2. Xóa topic
curl -X DELETE http://localhost:3000/api/admin/topics/test-delete
```

### Test Cập nhật Topic

```bash
# 1. Tạo topic test
curl -X POST http://localhost:3000/api/admin/topics \
  -H "Content-Type: application/json" \
  -d '{
    "topicName": "test-update",
    "numPartitions": 3,
    "replicationFactor": 1
  }'

# 2. Cập nhật cấu hình
curl -X PATCH http://localhost:3000/api/admin/topics/test-update \
  -H "Content-Type: application/json" \
  -d '{
    "numPartitions": 5,
    "configs": {
      "retention.ms": "86400000",
      "compression.type": "gzip"
    }
  }'

# 3. Kiểm tra chi tiết
curl http://localhost:3000/api/admin/topics/test-update
```

---

## 🎯 Tính năng nâng cao có thể thêm

1. **Bulk Delete** - Xóa nhiều topics cùng lúc
2. **Export/Import Config** - Xuất/nhập cấu hình
3. **Clone Topic** - Sao chép topic với cấu hình tương tự
4. **Topic Template** - Tạo template cấu hình cho topics mới
5. **Audit Log** - Lưu lịch sử thay đổi
6. **Rollback** - Hoàn tác thay đổi cấu hình

---

## 📝 Notes

- Xóa topic sẽ xóa **tất cả messages** trong topic đó
- Không thể giảm số partitions vì Kafka không hỗ trợ
- Một số cấu hình có thể yêu cầu restart Kafka broker
- Nên backup dữ liệu quan trọng trước khi xóa topic
