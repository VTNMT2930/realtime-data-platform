import { defineStore } from "pinia";
import { ref } from "vue";
import {
  getTopics,
  createTopic as createTopicApi,
  deleteTopic as deleteTopicApi,
  updateTopic as updateTopicApi,
  getTopicDetail as getTopicDetailApi,
  getProducerLogs,
} from "@/services/apiService";

// Định nghĩa store
export const useKafkaStore = defineStore("kafka", () => {
  // === STATE ===
  const topics = ref([]);
  const messages = ref({}); // Sẽ lưu dạng { topicName: [...] }
  const logs = ref([]); // Producer logs
  const loading = ref(false);
  const error = ref(null);

  // === ACTIONS ===

  // Lấy danh sách topic từ backend
  async function fetchTopics() {
    loading.value = true;
    error.value = null;
    try {
      console.log("Store: Đang lấy danh sách topics từ backend...");
      const response = await getTopics();

      // Backend trả về format: { status: 'success', data: [...] }
      const data = response.data || response;

      console.log("Store: Response từ backend:", response);
      console.log("Store: Data topics:", data);

      // Transform data từ backend thành format frontend cần
      if (Array.isArray(data)) {
        topics.value = data.map((topic) => {
          // ✅ Backend trả về enriched data với statistics
          // Cấu trúc: { name, partitions, totalRecords, batches, consumerCount, partitionDetails }

          // Legacy fallback: partitions có thể là array (old format) hoặc number (new format)
          const partitionsArray =
            topic.partitionDetails || topic.partitions || [];
          const totalPartitions =
            typeof topic.partitions === "number"
              ? topic.partitions
              : partitionsArray.length;

          // Tính tổng log size từ các partitions (nếu có)
          let totalLogSize = 0;
          let totalMessages = 0;

          if (Array.isArray(partitionsArray)) {
            partitionsArray.forEach((partition) => {
              // highWatermark là số lượng messages trong partition
              if (partition.highWatermark) {
                totalMessages += parseInt(partition.highWatermark) || 0;
              }
            });
          }

          return {
            name: topic.name || topic.topicName || topic,
            dataIn: formatBytes(0), // Backend chưa cung cấp, để mặc định
            dataOut: formatBytes(0), // Backend chưa cung cấp, để mặc định
            messagesIn: totalMessages > 0 ? formatNumber(totalMessages) : 0,
            consumerGroups: 0, // Legacy field
            logSize: formatBytes(totalLogSize),
            // ✅ New enriched fields from backend
            partitions: totalPartitions,
            totalRecords: topic.totalRecords || 0,
            batches: topic.batches || 0,
            consumerCount: topic.consumerCount || 0,
            // Metadata
            metadata: topic,
            fetchedAt: Date.now(),
          };
        });

        // Sắp xếp topics: mới nhất lên đầu (theo tên)
        topics.value.sort((a, b) => {
          // Topics được tạo sau thường có tên "mới hơn" (alphabet)
          return b.name.localeCompare(a.name);
        });
      } else {
        console.warn("Store: Data không phải array:", data);
        topics.value = [];
      }

      console.log("Store: Lấy topics thành công:", topics.value);
    } catch (err) {
      console.error("Store: Lỗi khi lấy topics:", err);
      error.value = err.message;
      topics.value = []; // Reset về empty array khi có lỗi
    } finally {
      loading.value = false;
    }
  }

  // Lấy logs từ backend (messages/transactions)
  async function fetchLogs() {
    loading.value = true;
    error.value = null;
    try {
      console.log("Store: Đang lấy producer logs từ backend...");
      const response = await getProducerLogs();
      console.log("Store: Response từ API:", response);

      // Backend trả về format: { success: true, data: [...], pagination: {...} }
      if (response.success && response.data) {
        logs.value = response.data;
      } else {
        logs.value = response; // Fallback nếu format khác
      }

      console.log("Store: Lấy logs thành công:", logs.value);
      return logs.value;
    } catch (err) {
      console.error("Store: Lỗi khi lấy logs:", err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  // Lấy messages cho 1 topic (từ logs)
  async function fetchMessages(topicName) {
    console.log("Store: Lấy messages cho topic:", topicName);

    // Luôn fetch logs mới nhất từ backend
    await fetchLogs();

    // ✅ FILTER logs theo topic VÀ loại bỏ batch logs
    const topicLogs = logs.value.filter((log) => {
      // So sánh topic (case-insensitive)
      const matchTopic =
        log.topic && log.topic.toLowerCase() === topicName.toLowerCase();

      // Loại bỏ batch logs (originalFileName bắt đầu với "Batch ")
      const isNotBatchLog =
        !log.originalFileName || !log.originalFileName.startsWith("Batch ");

      return matchTopic && isNotBatchLog;
    });

    console.log(
      `Store: Tìm thấy ${topicLogs.length} logs cho topic "${topicName}" (đã loại bỏ batch logs)`
    );
    console.log("Store: Topic logs:", topicLogs);

    // Transform logs thành messages format
    messages.value[topicName] = topicLogs.map((log, index) => {
      // Parse data nếu là JSON string
      let parsedData = null;
      try {
        parsedData = log.data ? JSON.parse(log.data) : null;
      } catch (e) {
        parsedData = log.data;
      }

      return {
        offset: log.id || index,
        partition: 0,
        startTime: new Date(log.createdAt).toLocaleString("vi-VN"),
        endTime: new Date(log.updatedAt).toLocaleString("vi-VN"),
        duration: `${
          new Date(log.updatedAt).getTime() - new Date(log.createdAt).getTime()
        } ms`,
        status: getStatusText(log.status),
        message: formatMessageData(log, parsedData),
      };
    });

    console.log(
      "Store: Messages cho topic",
      topicName,
      ":",
      messages.value[topicName]
    );
  }

  // Format message data để hiển thị
  function formatMessageData(log, parsedData) {
    if (log.type === "SINGLE") {
      // Hiển thị data của single message
      if (parsedData && typeof parsedData === "object") {
        return JSON.stringify(parsedData);
      }
      return log.data || "N/A";
    } else if (log.type === "FILE") {
      // ✅ Chỉ hiển thị message summary từ parsedData
      if (parsedData && typeof parsedData === "object") {
        // Nếu có message từ backend
        if (parsedData.message) {
          return parsedData.message;
        }
        // Nếu có totalRecords và totalBatches
        if (parsedData.totalRecords && parsedData.totalBatches) {
          return `Đã gửi thành công ${parsedData.totalRecords} records trong ${parsedData.totalBatches} batches tới Kafka topic: ${log.topic}`;
        }
      }
      // Fallback
      return `File: ${log.originalFileName || "Unknown"}`;
    }
    return log.errorMessage || "N/A";
  }

  // Tạo topic mới
  async function createTopic(formData) {
    loading.value = true;
    error.value = null;
    try {
      console.log("Store: Đang tạo topic mới:", formData);

      // Transform data từ form sang format backend cần
      const payload = {
        topicName: formData.topicName,
        numPartitions: formData.partitions || formData.numPartitions,
        replicationFactor: formData.replicationFactor,
      };

      const result = await createTopicApi(payload);
      console.log("Store: Tạo topic thành công:", result);

      // Không thêm vào state ở đây, để view tự fetch lại từ backend
      // Điều này đảm bảo dữ liệu được đồng bộ chính xác từ Kafka

      return result;
    } catch (err) {
      console.error("Store: Lỗi khi tạo topic:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Xóa topic
  async function deleteTopic(topicName) {
    loading.value = true;
    error.value = null;
    try {
      console.log("Store: Đang xóa topic:", topicName);
      const result = await deleteTopicApi(topicName);
      console.log("Store: Xóa topic thành công:", result);

      // Xóa khỏi state local NGAY LẬP TỨC
      const oldLength = topics.value.length;
      topics.value = topics.value.filter((t) => t.name !== topicName);
      console.log(
        `Store: Đã xóa topic khỏi local state (${oldLength} -> ${topics.value.length})`
      );

      return result;
    } catch (err) {
      console.error("Store: Lỗi khi xóa topic:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Cập nhật topic
  async function updateTopic(topicName, updateData) {
    loading.value = true;
    error.value = null;
    try {
      console.log("Store: Đang cập nhật topic:", topicName, updateData);
      const result = await updateTopicApi(topicName, updateData);
      console.log("Store: Cập nhật topic thành công:", result);

      // Fetch lại danh sách topics để có dữ liệu mới nhất
      await fetchTopics();

      return result;
    } catch (err) {
      console.error("Store: Lỗi khi cập nhật topic:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Lấy chi tiết topic
  async function getTopicDetail(topicName) {
    loading.value = true;
    error.value = null;
    try {
      console.log("Store: Đang lấy chi tiết topic:", topicName);
      const result = await getTopicDetailApi(topicName);
      console.log("Store: Lấy chi tiết topic thành công:", result);
      return result;
    } catch (err) {
      console.error("Store: Lỗi khi lấy chi tiết topic:", err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Helper functions
  function calculateDuration(start, end) {
    const diff = new Date(end) - new Date(start);
    const seconds = Math.floor(diff / 1000);
    return seconds > 0 ? `${seconds}s` : "0s";
  }

  function getStatusText(status) {
    const statusMap = {
      PENDING: "Đang xử lý",
      SENT: "Đang xử lý",
      CONSUMED: "Thành công",
      CONSUME_FAILED: "Thất bại",
    };
    return statusMap[status] || status;
  }

  // Format bytes thành human readable
  function formatBytes(bytes) {
    if (bytes === 0) return "0B";
    if (!bytes) return "0B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  // Format number với suffix
  function formatNumber(num) {
    if (num === 0) return 0;
    if (!num) return 0;

    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "m";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num;
  }

  // === EXPORT ===
  return {
    // State
    topics,
    messages,
    logs,
    loading,
    error,
    // Actions
    fetchTopics,
    fetchMessages,
    fetchLogs,
    createTopic,
    deleteTopic,
    updateTopic,
    getTopicDetail,
  };
});
