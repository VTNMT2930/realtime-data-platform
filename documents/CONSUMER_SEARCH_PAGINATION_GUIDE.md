# Consumer Dashboard - Search và Pagination Guide

## Tính năng mới đã thêm

### 🔍 **Search (Tìm kiếm)**
Cho phép tìm kiếm consumer theo:
- **Consumer ID**: Tên định danh của consumer
- **Hostname**: Tên máy chủ đang chạy consumer  
- **PID**: Process ID của consumer
- **Group ID**: Kafka consumer group

### 📄 **Pagination (Phân trang)**
- **Mặc định**: 6 consumers mỗi trang
- **Tùy chọn**: 6, 12, 24, 50 items per page
- **Smart pagination**: Hiển thị thông minh các số trang
- **Navigation**: Previous/Next và jump to page

### 🎛️ **Status Filter**
- **All Status**: Hiển thị tất cả consumers
- **Active Only**: Chỉ consumers đang hoạt động
- **Inactive Only**: Chỉ consumers đã dừng

## Giao diện người dùng

### Search Bar
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Search by Consumer ID, hostname, or PID...     [X] │
└─────────────────────────────────────────────────────────┘
```

### Filter Controls
```
[All Status ▼]    [6 per page ▼]
```

### Results Info
```
Found 3 result(s) for "test" with status "active"
```

### Pagination
```
Showing 1-6 of 15 results          Page 1 of 3

[◀] [1] [2] [3] [▶]
```

## Cách sử dụng

### 1. Tìm kiếm Consumer
- Nhập từ khóa vào search box
- Tìm kiếm real-time (không cần nhấn Enter)
- Click [X] để xóa search

**Ví dụ tìm kiếm:**
- `test` - Tìm consumer có ID chứa "test"
- `1234` - Tìm consumer có PID là 1234
- `localhost` - Tìm consumer chạy trên localhost

### 2. Lọc theo Status
- **All Status**: Hiển thị tất cả
- **Active Only**: Chỉ consumers đang chạy
- **Inactive Only**: Chỉ consumers đã dừng

### 3. Thay đổi số items mỗi trang
- Chọn từ dropdown: 6, 12, 24, 50
- Tự động reset về trang 1

### 4. Điều hướng trang
- **Previous/Next buttons**: Chuyển trang liền kề
- **Page numbers**: Jump trực tiếp đến trang
- **Smart display**: Hiện thông minh khi có nhiều trang

## Logic Hoạt động

### Search Logic
```javascript
// Tìm kiếm trong multiple fields
filteredConsumers() {
  let filtered = [...this.consumers];
  
  if (this.searchQuery.trim()) {
    const query = this.searchQuery.toLowerCase();
    filtered = filtered.filter(consumer => 
      consumer.consumerId?.toLowerCase().includes(query) ||
      consumer.hostname?.toLowerCase().includes(query) ||
      consumer.pid?.toString().includes(query) ||
      consumer.groupId?.toLowerCase().includes(query)
    );
  }
  
  // Apply status filter
  if (this.statusFilter !== 'all') {
    filtered = filtered.filter(consumer => 
      consumer.status?.toLowerCase() === this.statusFilter
    );
  }
  
  return filtered;
}
```

### Pagination Logic
```javascript
// Tính toán items cho trang hiện tại
paginatedConsumers() {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  const end = start + this.itemsPerPage;
  return this.filteredConsumers.slice(start, end);
}

// Smart page numbers
visiblePages() {
  // Logic hiển thị thông minh: 1 ... 4 5 6 ... 10
}
```

### Auto Reset
```javascript
watch: {
  searchQuery() { this.currentPage = 1; },
  statusFilter() { this.currentPage = 1; },
  itemsPerPage() { this.currentPage = 1; }
}
```

## Responsive Design

### Desktop (lg+)
```
┌─────────┬─────────┬─────────┐
│Consumer1│Consumer2│Consumer3│
├─────────┼─────────┼─────────┤
│Consumer4│Consumer5│Consumer6│
└─────────┴─────────┴─────────┘
```

### Tablet (md)
```
┌─────────┬─────────┐
│Consumer1│Consumer2│
├─────────┼─────────┤
│Consumer3│Consumer4│
└─────────┴─────────┘
```

### Mobile (sm)
```
┌─────────────────────┐
│      Consumer1      │
├─────────────────────┤
│      Consumer2      │
└─────────────────────┘
```

## Empty States

### 1. No Consumers
```
    👥
No consumers running
Click "Add Consumer" to start
```

### 2. No Search Results
```
    🔍
No consumers found
No results for "xyz" with status "active"
[Clear filters]
```

## Performance Optimizations

### 1. Client-side Processing
- Search và filter xử lý trên client
- Không gọi API cho mỗi lần tìm kiếm
- Real-time filtering

### 2. Smart Pagination
- Chỉ render consumers hiện tại
- Lazy loading cho large datasets
- Memory efficient

### 3. Debounced Search
- Có thể thêm debounce nếu cần
- Giảm tải khi user type nhanh

## Testing Scenarios

### Test Search
1. Tạo nhiều consumers với tên khác nhau
2. Search từng keyword và verify results
3. Test case-insensitive search
4. Test special characters

### Test Pagination
1. Tạo > 6 consumers để test pagination
2. Thay đổi items per page
3. Navigate qua các trang
4. Test với search results < 6 items

### Test Status Filter
1. Tạo mix của active/inactive consumers
2. Test filter "Active Only"
3. Test filter "Inactive Only" 
4. Combine với search

### Test Edge Cases
1. Search không tìm thấy gì
2. Chỉ có 1 consumer
3. Exactly 6 consumers (no pagination)
4. Empty search query

## Future Enhancements

### Planned Features
- [ ] Sort by columns (ID, Status, Created Date)
- [ ] Advanced filters (by date range, hostname)
- [ ] Export search results
- [ ] Saved search queries
- [ ] Bulk actions (stop/resume multiple)
- [ ] Server-side search cho large datasets
- [ ] Search history
- [ ] Keyboard shortcuts (Ctrl+F focus search)

### Performance Improvements
- [ ] Virtual scrolling cho very large lists
- [ ] Server-side pagination API
- [ ] Caching search results
- [ ] Background sync với WebSocket

## API Integration

### Current Implementation
```javascript
// Client-side filtering từ props
consumers() {
  return this.consumerInstances || [];
}
```

### Future Server-side API
```javascript
// Có thể extend để support server-side search
async searchConsumers(query, filters, page, limit) {
  return await apiService.get('/consumers/search', {
    params: { query, ...filters, page, limit }
  });
}
```