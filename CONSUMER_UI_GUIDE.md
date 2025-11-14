# 🎨 Consumer Management UI Guide

Hướng dẫn sử dụng giao diện quản lý Consumer instances.

## 📋 Tính năng

### ✅ Đã implement:

1. **Button "Add Consumer"** trong Dashboard và Consumer Dashboard
2. **Modal nhập Consumer ID** (optional - auto-generate nếu không nhập)
3. **Table/Grid hiển thị list consumers** với đầy đủ thông tin
4. **Button "Stop"** cho từng consumer
5. **Real-time status** với auto-refresh mỗi 5 giây
6. **Color indicators** - Xanh (Active), Đỏ (Inactive/Crashed)
7. **Warning messages** cho consumers bị sập

---

## 🎯 Cách Sử dụng

### 1. Từ Main Dashboard

**Route:** `/` (http://localhost:5173)

#### Thêm Consumer nhanh:

1. Nhìn vào **Consumer Card** (màu xanh lá)
2. Click nút **"Add Consumer"** ở dưới cùng
3. Modal sẽ hiện ra
4. Có thể:
   - Để trống → Auto-generate ID (vd: `consumer-1730649000123`)
   - Nhập tên custom (vd: `consumer-analytics`)
   - Chọn Kafka Group (optional)
5. Click **"Create Consumer"**
6. Đợi 5-10 giây để consumer start và register
7. Số Active sẽ tự động tăng: `1/1` → `2/2`

#### Xem chi tiết:

- Click vào **Consumer Card** hoặc nút **→** để vào Consumer Dashboard

---

### 2. Từ Consumer Dashboard

**Route:** `/consumer-dashboard`

#### View hiển thị:

**A. Summary Statistics** (4 cards trên cùng)

- Total Messages
- Processed
- Success Rate
- Failed Messages

**B. Active Consumers Section** (Component chính)

Hiển thị dạng **Grid Cards** với thông tin:

- ✅ **Consumer ID** - Tên consumer
- 🟢/🔴 **Status Indicator** - Active (xanh) hoặc Inactive (đỏ)
- 🆔 **PID** - Process ID
- 👥 **Group ID** - Kafka consumer group
- ⏰ **Started At** - Thời gian khởi động (relative time)
- 🛑 **Stop Button** - Dừng consumer

**C. Statistics by Topic** (Table dưới cùng)

---

### 3. Thêm Consumer

#### Từ Consumer Dashboard:

1. Click nút **"Add Consumer"** (màu xanh, góc phải trên)
2. Modal hiện ra với 2 fields:

   **Consumer ID (Optional)**

   - Để trống → Auto: `consumer-1730649000123`
   - Nhập custom: `consumer-analytics`, `consumer-worker-1`

   **Kafka Consumer Group (Optional)**

   - Mặc định: `platform-consumer-group-server`
   - Có thể đổi: `analytics-group`, `workers-group`

3. Thông tin hiển thị:

   ```
   📌 Lưu ý:
   • Port sẽ tự động tăng (3001, 3002, 3003...)
   • Consumer sẽ xuất hiện trong Dashboard sau ~10 giây
   • Có thể stop consumer bất cứ lúc nào
   ```

4. Click **"Create Consumer"**

5. Loading spinner xuất hiện

6. Thành công → Message màu xanh:

   ```
   ✓ Consumer consumer-analytics đã được khởi động
   ```

7. Modal tự động đóng sau 2 giây

8. Consumer mới xuất hiện trong grid sau 3-5 giây

---

### 4. Monitor Consumer Status

#### Active Consumer (Màu Xanh ✅)

```
┌─────────────────────────────┐
│  🟢 consumer-1              │
│     • Active                │
│                             │
│  # PID: 12345               │
│  👥 platform-consumer-...   │
│  ⏰ 2m ago                   │
│                             │
│  [    Stop    ]             │
└─────────────────────────────┘
```

**Đặc điểm:**

- Border xanh lá
- Background xanh nhạt
- Dot indicator: 🟢 (animate pulse)
- Có thể stop

---

#### Inactive Consumer (Màu Đỏ ❌)

```
┌─────────────────────────────┐
│  🔴 consumer-2              │
│     • Inactive              │
│                             │
│  # PID: 12346               │
│  👥 platform-consumer-...   │
│  ⏰ 5m ago                   │
│                             │
│  [    Stop    ] (disabled)  │
│                             │
│  ⚠️ Consumer stopped or     │
│     crashed. No heartbeat   │
│     for 30+ seconds.        │
└─────────────────────────────┘
```

**Đặc điểm:**

- Border đỏ
- Background đỏ nhạt
- Dot indicator: 🔴 (animate pulse)
- Warning box màu đỏ ở dưới
- Button Stop bị disabled (màu xám)

---

### 5. Stop Consumer

#### Từ Consumer Dashboard:

1. Tìm consumer muốn stop
2. Click nút **"Stop"** (màu đỏ)
3. Confirm dialog hiện ra:
   ```
   Are you sure you want to stop consumer "consumer-1"?
   ```
4. Click **OK**
5. Button hiển thị "Stopping..." với spinner
6. Consumer biến mất khỏi list (hoặc status → Inactive)
7. Active count giảm: `3/3` → `2/3`

---

## 🎨 UI Components

### 1. AddConsumerModal.vue

**Props:**

- `isOpen` (Boolean) - Hiển thị modal hay không

**Events:**

- `@close` - Đóng modal
- `@consumer-created` - Consumer được tạo thành công

**Features:**

- Input validation
- Auto-generate ID
- Loading state
- Success/Error messages
- Auto-close after success

---

### 2. ConsumerList.vue

**Props:**

- `consumerInstances` (Array) - Danh sách consumers từ parent

**Events:**

- `@consumer-created` - Consumer mới được tạo
- `@consumer-stopped` - Consumer bị stop

**Features:**

- Auto-refresh every 5 seconds
- Grid layout (responsive)
- Status indicators
- Real-time updates
- Stop confirmation
- Empty state
- Loading state

---

### 3. Updated Views

**DashboardView.vue**

- Thêm button "Add Consumer" trong Consumer card
- Import AddConsumerModal
- Handle consumer-created event

**ConsumerDashboardView.vue**

- Replace old Active Consumers section
- Use ConsumerList component
- Handle consumer events
- Refresh data on changes

---

## 🔄 Data Flow

```
User clicks "Add Consumer"
        ↓
Modal opens
        ↓
User fills form (optional)
        ↓
Click "Create Consumer"
        ↓
API: POST /api/admin/consumers
        ↓
API Gateway spawns consumer process
        ↓
Consumer starts (auto port 3001+)
        ↓
Consumer registers in DB
        ↓
Heartbeat every 10s
        ↓
UI auto-refresh (5s interval)
        ↓
Consumer appears in grid
        ↓
Status: Active (green)
```

---

## 📊 Real-time Updates

### Auto-refresh Logic:

1. **ConsumerList Component:**

   - Interval: 5 seconds
   - Fetches: `GET /api/admin/consumers`
   - Updates: Consumer cards với status mới

2. **Consumer Status Check:**

   - Server-side heartbeat: 10 seconds
   - Timeout: 30 seconds no heartbeat → Inactive
   - UI reflects status immediately on next refresh

3. **Dashboard Stats:**
   - Auto-refresh: 5 seconds
   - Updates: Active/Total counts
   - Syncs với consumer instances

---

## 🎯 User Scenarios

### Scenario 1: Add first consumer

```
1. Dashboard shows: Active: 0/0
2. Click "Add Consumer"
3. Leave fields empty → Auto ID
4. Click "Create Consumer"
5. Wait 10 seconds
6. Dashboard shows: Active: 1/1
7. Consumer card appears (green)
```

### Scenario 2: Add multiple consumers

```
1. Active: 1/1
2. Add consumer-2 → Active: 2/2
3. Add consumer-3 → Active: 3/3
4. Grid shows 3 green cards
```

### Scenario 3: Consumer crashes

```
1. Active: 3/3
2. Consumer-2 crashes (close terminal)
3. After 30 seconds (no heartbeat)
4. Active: 2/3
5. Consumer-2 card turns RED
6. Warning message appears
```

### Scenario 4: Stop consumer

```
1. Active: 3/3
2. Click "Stop" on consumer-1
3. Confirm dialog
4. Consumer-1 removed from list
5. Active: 2/2
```

### Scenario 5: Scale up under load

```
1. Active: 2/2
2. High load detected
3. Click "Add Consumer" → consumer-3
4. Click "Add Consumer" → consumer-4
5. Active: 4/4
6. Load distributed across 4 consumers
```

---

## 🚨 Error Handling

### Error Messages:

**Creation Failed:**

```
❌ Consumer consumer-1 đã đang chạy
```

**Stop Failed:**

```
❌ Consumer consumer-5 không tồn tại hoặc không chạy
```

**Network Error:**

```
❌ An error occurred while creating consumer
```

---

## 💡 Tips & Best Practices

1. **Naming Convention:**

   - Use descriptive names: `consumer-analytics`, `consumer-worker-1`
   - Avoid special characters
   - Keep it short (<30 chars)

2. **Monitoring:**

   - Watch Active count: Should be X/X (all active)
   - Red cards = investigate immediately
   - Check logs in terminal windows

3. **Scaling:**

   - Start with 1-2 consumers
   - Add more under load
   - Remove idle consumers to save resources

4. **Cleanup:**
   - Stop unused consumers
   - Don't leave inactive consumers
   - Use `stop-consumers.ps1` to stop all

---

## 🎉 Kết luận

UI đã hoàn chỉnh với:

- ✅ Add Consumer functionality
- ✅ Real-time status monitoring
- ✅ Stop Consumer với confirmation
- ✅ Color-coded status (Green/Red)
- ✅ Auto-refresh every 5s
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

Giờ bạn có thể quản lý consumers hoàn toàn từ UI! 🚀
