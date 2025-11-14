# 🚀 Quick Start - Test Multi-Consumer

## Cách nhanh nhất để test:

### 1️⃣ Test với 2 consumers:

```powershell
.\quick-test.ps1
```

### 2️⃣ Test với nhiều scenarios:

```powershell
.\test-scenarios.ps1
```

### 3️⃣ Custom số lượng consumers:

```powershell
# Start 5 consumers
.\start-multiple-consumers.ps1 -NumInstances 5
```

### 4️⃣ Stop tất cả:

```powershell
.\stop-consumers.ps1
```

---

## 📺 Xem kết quả:

1. Mở Dashboard: http://localhost:5173
2. Xem Consumer card → `Active: X/Y`
3. X = số consumers đang chạy
4. Y = tổng số consumers

---

## 🎯 Các file script có sẵn:

| File                           | Mô tả                           |
| ------------------------------ | ------------------------------- |
| `quick-test.ps1`               | ⚡ Start 2 consumers nhanh nhất |
| `test-scenarios.ps1`           | 🧪 Menu test các scenarios      |
| `start-multiple-consumers.ps1` | 🚀 Start N consumers            |
| `stop-consumers.ps1`           | 🛑 Stop tất cả consumers        |
| `start-consumers.bat`          | 📦 Batch file (alternative)     |

---

## 💡 Tips:

- Mỗi consumer cần 10 giây để heartbeat lần đầu
- Inactive timeout = 30 giây
- Dashboard auto-refresh = 5 giây
- Mỗi consumer chạy trên port khác nhau (3001, 3002, 3003...)

---

Đọc thêm: **MULTI_CONSUMER_GUIDE.md** để biết chi tiết hơn! 📖
