# Topic List Statistics Integration

## Tổng quan

Tích hợp thống kê chi tiết cho danh sách Topic, bao gồm:

- **Total Records**: Tổng số records đã được produce vào topic
- **Batches**: Số lượng batches đã được gửi
- **Partitions**: Số lượng partitions của topic
- **Consumer Count**: Số lượng consumers đang đăng ký topic

## Các thay đổi

### 1. Backend - Admin Service (`admin.service.ts`)

#### ✅ Cập nhật `listTopics()` method

**Vị trí**: `backend/api-gateway-producer/src/admin/admin.service.ts`

**Chức năng**: Enrich Kafka metadata với application statistics

```typescript
async listTopics() {
  // 1. Lấy Kafka metadata (topics, partitions)
  const topics = await this.kafkaAdmin.listTopics();
  const metadata = await this.kafkaAdmin.fetchTopicMetadata({ topics });

  // 2. Lấy producer statistics (totalRecords, batches)
  // 3. Lấy consumer statistics (consumerCount)
  const [producerStats, consumerStats] = await Promise.all([
    this.getProducerStatsByTopic(),
    this.getConsumerStatsByTopic(),
  ]);

  // 4. Merge data
  const enrichedTopics = metadata.topics.map((topic) => ({
    name: topic.name,
    partitions: topic.partitions.length,
    totalRecords: producerStats[topic.name]?.totalRecords || 0,
    batches: producerStats[topic.name]?.batches || 0,
    consumerCount: consumerStats[topic.name]?.consumerCount || 0,
    partitionDetails: topic.partitions,
  }));

  return { status: 'success', data: enrichedTopics };
}
```

#### ✅ Thêm helper method `getProducerStatsByTopic()`

**Chức năng**: Query Producer Service để lấy statistics từ `producer_logs` table

- Gọi API: `GET http://127.0.0.1:3000/api/producers/statistics`
- Sử dụng endpoint có sẵn (đã được implement trước đó)
- Trả về: `{ topic: string, totalRecords: number, totalBatches: number }[]`

#### ✅ Thêm helper method `getConsumerStatsByTopic()`

**Chức năng**: Query Consumer Service để đếm số active consumers theo topic

- Gọi API: `GET http://127.0.0.1:3001/api/consumers/instances`
- Đếm số consumers có `status === 'ACTIVE'` cho mỗi `topicName`
- Trả về: `{ [topicName]: { consumerCount: number } }`

**Error Handling**:

- Cả 2 helpers đều có try-catch với fallback return empty object `{}`
- Nếu service không available, statistics sẽ hiển thị 0
- Console.warn để debug nhưng không làm crash ứng dụng

---

### 2. Frontend - Kafka Store (`kafkaStore.js`)

#### ✅ Cập nhật `fetchTopics()` method

**Vị trí**: `frontend/src/stores/kafkaStore.js`

**Thay đổi**: Update mapping logic để handle enriched topic data từ backend

```javascript
topics.value = data.map((topic) => {
  // ✅ Backend trả về enriched data
  const totalPartitions =
    typeof topic.partitions === "number"
      ? topic.partitions
      : (topic.partitions || []).length;

  return {
    name: topic.name,
    partitions: totalPartitions,
    totalRecords: topic.totalRecords || 0,
    batches: topic.batches || 0,
    consumerCount: topic.consumerCount || 0,
    // ... other fields
  };
});
```

**Backward Compatibility**:

- Hỗ trợ cả old format (partitions là array) và new format (partitions là number)
- Fallback to 0 nếu không có data từ backend

---

### 3. Frontend - Topic List View (`TopicListView.vue`)

#### ✅ Thêm cột "Partitions"

**Vị trí**: Giữa cột "Batches" và "Số lượng Consumer đăng ký"

```vue
<th>Partitions</th>
<td>
  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
    {{ topic.partitions || 0 }}
  </span>
</td>
```

**Hiển thị**:

- Badge màu xám nhạt để phân biệt với consumer count (màu xanh)
- Format: số nguyên, không cần toLocaleString()

#### ✅ Đã có sẵn các cột khác (từ commit trước)

- **Topic**: Button với router-link đến detail page
- **Total Records**: Format với `toLocaleString()`
- **Batches**: Format với `toLocaleString()`
- **Số lượng Consumer đăng ký**: Badge xanh với format "X consumers"

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (TopicListView)                 │
│  Hiển thị: Topic | Total Records | Batches | Partitions |  │
│                   Consumer Count | Actions                 │
└────────────────────────┬────────────────────────────────────┘
                         │ GET /api/admin/topics
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Admin Service (api-gateway-producer)           │
│  1. listTopics() → fetchTopicMetadata() → Kafka Admin      │
│  2. getProducerStatsByTopic()                               │
│     └─► GET /api/producers/statistics                       │
│  3. getConsumerStatsByTopic()                               │
│     └─► GET /api/consumers/instances                        │
│  4. Merge all data → Return enriched topics                 │
└─────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌──────────────────────┐          ┌─────────────────────────┐
│  Producer Service    │          │   Consumer Service      │
│  - producer_logs DB  │          │   - consumer_instances  │
│  - Query by topic    │          │   - Filter ACTIVE       │
│  - Count records     │          │   - Group by topicName  │
└──────────────────────┘          └─────────────────────────┘
```

---

## API Endpoints

### Producer Statistics

**URL**: `GET http://127.0.0.1:3000/api/producers/statistics`

**Response**:

```json
{
  "success": true,
  "byTopic": [
    {
      "topic": "transactions_topic",
      "totalRecords": 1500,
      "totalBatches": 15,
      "completed": 14,
      "failed": 1,
      "averageDuration": 234.5
    }
  ]
}
```

### Consumer Instances

**URL**: `GET http://127.0.0.1:3001/api/consumers/instances`

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "consumerId": "consumer-01",
      "topicName": "transactions_topic",
      "status": "ACTIVE",
      "startedAt": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### Admin List Topics (After Enhancement)

**URL**: `GET http://127.0.0.1:3000/api/admin/topics`

**Response**:

```json
{
  "status": "success",
  "data": [
    {
      "name": "transactions_topic",
      "partitions": 3,
      "totalRecords": 1500,
      "batches": 15,
      "consumerCount": 2,
      "partitionDetails": [...]
    }
  ]
}
```

---

## Testing Checklist

### Backend

- [ ] Producer Service running on port 3000
- [ ] Consumer Service running on port 3001
- [ ] Test `GET /api/producers/statistics` returns byTopic array
- [ ] Test `GET /api/consumers/instances` returns active consumers
- [ ] Test `GET /api/admin/topics` returns enriched data với 5 fields

### Frontend

- [ ] kafkaStore.fetchTopics() maps data correctly
- [ ] TopicListView hiển thị 5 cột: Topic, Total Records, Batches, Partitions, Consumer Count
- [ ] Numbers được format với toLocaleString() (Total Records, Batches)
- [ ] Partitions hiển thị badge màu xám
- [ ] Consumer Count hiển thị badge xanh với format "X consumers"
- [ ] Data refresh khi tạo/xóa/update topic

### Edge Cases

- [ ] Producer Service offline → totalRecords = 0, batches = 0
- [ ] Consumer Service offline → consumerCount = 0
- [ ] Topic mới tạo (chưa có data) → all statistics = 0
- [ ] Topic có data nhưng không có consumer → consumerCount = 0

---

## Troubleshooting

### Statistics hiển thị 0 dù có data

1. Check Producer Service logs:

   ```bash
   # Xem có request đến /api/producers/statistics không
   # Xem producer_logs table có data không
   ```

2. Check Admin Service logs:
   ```bash
   # Search for "[Admin] Cannot fetch producer stats"
   # Check axios timeout (5000ms default)
   ```

### Consumer count không chính xác

1. Check Consumer Service API:

   ```bash
   curl http://127.0.0.1:3001/api/consumers/instances
   ```

2. Verify consumer_instances table:
   ```sql
   SELECT topicName, COUNT(*)
   FROM consumer_instances
   WHERE status = 'ACTIVE'
   GROUP BY topicName;
   ```

### Partitions hiển thị 0

- Check Kafka Admin metadata: `admin.fetchTopicMetadata({ topics })`
- Verify topic actually exists trong Kafka cluster

---

## Next Steps

### Potential Enhancements

1. **Real-time Updates**: WebSocket để update statistics khi có data mới
2. **Caching**: Cache producer/consumer stats trong Admin Service (TTL: 30s)
3. **Historical Data**: Chart để xem trend của totalRecords theo thời gian
4. **Consumer Details**: Click vào consumer count → hiển thị danh sách consumers
5. **Performance**: Batch query thay vì call API riêng lẻ

### Related Features

- Topic Detail View: Hiển thị statistics chi tiết hơn
- Consumer Dashboard: Link từ Topic List đến Consumer List filtered by topic
- Producer Dashboard: Link từ Topic List đến Producer Logs filtered by topic

---

## Commit History

1. ✅ Added Partitions column to Topic List UI
2. ✅ Enhanced admin.service.ts listTopics() với producer/consumer stats
3. ✅ Updated kafkaStore to handle enriched topic data
4. ✅ Added helper methods for fetching statistics from services

**Date**: 2025-01-20  
**Author**: AI Assistant  
**Status**: ✅ Completed
