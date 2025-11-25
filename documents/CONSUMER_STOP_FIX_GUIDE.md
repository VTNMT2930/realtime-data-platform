# Test Consumer Stop/Resume Logic

## Vấn đề đã sửa

**Vấn đề cũ**: Khi stop consumer, heartbeat vẫn tiếp tục chạy và ghi đè lại trạng thái thành ACTIVE trong database.

**Giải pháp mới**: 
1. Thêm flag `isManuallyStoppedFlag` để track trạng thái stop local
2. Thêm field `shouldStop` trong database để signal giữa các consumer instances
3. Heartbeat sẽ check các điều kiện trước khi update status

## Cách test

### 1. Chuẩn bị Database
```sql
-- Chạy migration để thêm column shouldStop
ALTER TABLE consumer_instances 
ADD COLUMN shouldStop BOOLEAN DEFAULT false;

UPDATE consumer_instances 
SET shouldStop = false 
WHERE shouldStop IS NULL;
```

### 2. Start Consumer Service
```bash
cd backend/consumer-service
npm run start:dev
```

### 3. Test Stop Logic

#### Scenario 1: Stop Consumer từ UI
1. Mở Consumer Dashboard tại `http://localhost:3000`
2. Tạo một consumer mới qua "Add Consumer"
3. Chờ consumer xuất hiện với status "Active"
4. Click nút "Stop" trên consumer đó
5. **Expected**: Consumer chuyển thành "Inactive" và không tự động chuyển lại thành "Active"

#### Scenario 2: Refresh Page sau khi Stop  
1. Tiếp tục từ Scenario 1
2. Refresh trang browser (F5)
3. **Expected**: Consumer vẫn ở trạng thái "Inactive", không chuyển về "Active"

#### Scenario 3: Resume Consumer
1. Tiếp tục từ Scenario 2
2. Click nút "Resume" trên consumer inactive
3. **Expected**: Consumer chuyển thành "Active" và bắt đầu heartbeat lại

### 4. Check Database

```sql
-- Kiểm tra trạng thái trong database
SELECT id, status, shouldStop, lastHeartbeat 
FROM consumer_instances 
ORDER BY lastHeartbeat DESC;
```

**Expected Results:**
- Khi Stop: `status = 'INACTIVE'`, `shouldStop = false`
- Khi Resume: `status = 'ACTIVE'`, `shouldStop = false`

### 5. Check Console Logs

#### Stop Consumer (Logs expected):
```
[Consumer] ⏸️ Sent stop signal to consumer instance: consumer-xxx
[Consumer] ⏸️ Received STOP signal for consumer-xxx - stopping consumer  
[Consumer] ⏸️ Detected consumer-xxx is INACTIVE in DB - stopping heartbeat
```

#### Resume Consumer (Logs expected):
```
[Consumer] ▶️ Resetting manually stopped flag for current instance: consumer-xxx
[Consumer] ✅ Đã resume consumer instance: consumer-xxx
```

## Logic Flow

### Stop Flow:
1. User clicks "Stop" → API call `PUT /api/consumers/instances/:id/stop`
2. Service sets `shouldStop = true` trong database
3. Heartbeat detects `shouldStop = true` → updates `status = INACTIVE` và `shouldStop = false`
4. Set `isManuallyStoppedFlag = true` → ngừng heartbeat tiếp theo
5. Broadcast WebSocket event → UI updates real-time

### Resume Flow:
1. User clicks "Resume" → API call `PUT /api/consumers/instances/:id/resume`
2. Service updates `status = ACTIVE`, `shouldStop = false`, `lastHeartbeat = now`
3. Reset `isManuallyStoppedFlag = false` → tiếp tục heartbeat
4. Broadcast WebSocket event → UI updates real-time

### Heartbeat Logic:
```typescript
if (isManuallyStoppedFlag) {
  return; // Skip heartbeat
}

if (currentInstance.shouldStop) {
  // Self-stop và broadcast event
  updateStatus('INACTIVE');
  setFlag(true);
  return;
}

if (currentInstance.status === 'INACTIVE') {
  setFlag(true); // Ngừng heartbeat
  return;
}

// Normal heartbeat
updateStatus('ACTIVE');
```

## Debugging

### 1. Consumer không Stop được
- Kiểm tra database có field `shouldStop` không
- Check console logs xem có error trong heartbeat không
- Verify API endpoint trả về `success: true`

### 2. Consumer tự động chuyển về Active sau Stop
- **Nếu vẫn xảy ra**: Logic cũ vẫn chạy, cần restart service
- Check logs xem heartbeat có skip được không
- Verify `isManuallyStoppedFlag` được set đúng

### 3. UI không cập nhật
- Check WebSocket connection status
- Verify events được broadcast từ backend
- Check browser console có error không

## Files đã thay đổi

1. `consumers.service.ts`: Logic stop/resume/heartbeat
2. `consumer-instance.entity.ts`: Thêm field `shouldStop`  
3. `ConsumerList.vue`: UI cho nút Resume
4. `apiService.js`: API calls cho resume
5. `ConsumerDashboardView.vue`: Event handlers

## Breaking Changes

- **Database Schema**: Cần chạy migration để thêm column `shouldStop`
- **Consumer Instances**: Có thể cần restart tất cả consumer instances để apply logic mới