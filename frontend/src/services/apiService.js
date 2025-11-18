// Backend NestJS chạy ở 2 ports khác nhau
const PRODUCER_API_BASE_URL = "https://bxiuaztdmu.ap-southeast-2.awsapprunner.com/api";
const CONSUMER_API_BASE_URL = "https://un3yfhxmgj.ap-southeast-2.awsapprunner.com/api";

/**
 * Hàm gọi API chung (dùng fetch)
 * Tự động xử lý JSON và báo lỗi
 */
async function callApi(
  endpoint,
  options = {},
  baseUrl = PRODUCER_API_BASE_URL
) {
  // Gắn header mặc định nếu là method POST/PUT/PATCH (trừ FormData)
  if (
    (options.method === "POST" ||
      options.method === "PUT" ||
      options.method === "PATCH") &&
    !(options.body instanceof FormData)
  ) {
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  const response = await fetch(`${baseUrl}/${endpoint}`, options);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(
      `API call failed: ${errorData.message || response.statusText}`
    );
  }

  // Trả về JSON nếu có nội dung, ngược lại trả về null
  return response.status === 204 ? null : response.json();
}

// ============================================
// === ADMIN APIs ===
// ============================================

/**
 * Lấy danh sách tất cả topics
 * Backend: GET /api/admin/topics
 */
export const getTopics = () => {
  return callApi("admin/topics");
};

/**
 * Tạo một topic mới
 * Backend: POST /api/admin/topics
 * @param {Object} topicData - { topicName, numPartitions, replicationFactor }
 */
export const createTopic = (topicData) => {
  return callApi("admin/topics", {
    method: "POST",
    body: JSON.stringify(topicData),
  });
};

/**
 * Xóa một topic
 * Backend: DELETE /api/admin/topics/:topicName
 * @param {string} topicName - Tên topic cần xóa
 */
export const deleteTopic = (topicName) => {
  return callApi(`admin/topics/${encodeURIComponent(topicName)}`, {
    method: "DELETE",
  });
};

/**
 * Cập nhật cấu hình topic
 * Backend: PATCH /api/admin/topics/:topicName
 * @param {string} topicName - Tên topic
 * @param {Object} updateData - { numPartitions?, configs? }
 */
export const updateTopic = (topicName, updateData) => {
  return callApi(`admin/topics/${encodeURIComponent(topicName)}`, {
    method: "PATCH",
    body: JSON.stringify(updateData),
  });
};

/**
 * Lấy thông tin chi tiết một topic
 * Backend: GET /api/admin/topics/:topicName
 * @param {string} topicName - Tên topic
 */
export const getTopicDetail = (topicName) => {
  return callApi(`admin/topics/${encodeURIComponent(topicName)}`);
};

// ============================================
// === PRODUCER APIs ===
// ============================================

/**
 * Gửi một message đơn (single message) với topic
 * Backend: POST /api/producers/send/single?topic=xxx
 * @param {string} topic - Tên topic
 * @param {Object} messageData - { orderNumber, productName, quantity, price }
 */
export const sendSingleMessage = (topic, messageData) => {
  const queryParams = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return callApi(`producers/send/single${queryParams}`, {
    method: "POST",
    body: JSON.stringify(messageData),
  });
};

/**
 * Upload file CSV với topic
 * Backend: POST /api/producers/upload/csv?topic=xxx
 * @param {string} topic - Tên topic
 * @param {File} file - File object từ input type="file"
 */
export const uploadCsvFile = (topic, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const queryParams = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return callApi(`producers/upload/csv${queryParams}`, {
    method: "POST",
    body: formData, // Không set Content-Type, browser sẽ tự động set
  });
};

/**
 * Lấy danh sách logs với filter
 * Backend: GET /api/producers/logs
 * @param {Object} params - { page?, limit?, topic?, type? }
 */
export const getProducerLogs = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return callApi(`producers/logs${queryParams ? "?" + queryParams : ""}`);
};

/**
 * Lấy log chi tiết theo ID
 * Backend: GET /api/producers/logs/:id
 * @param {string} logId - ID của log
 */
export const getProducerLogById = (logId) => {
  return callApi(`producers/logs/${logId}`);
};

/**
 * Lấy file uploads summary (không bao gồm batch logs)
 * Backend: GET /api/producers/uploads
 * @param {Object} params - { page?, limit?, topic? }
 */
export const getFileUploads = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return callApi(`producers/uploads${queryParams ? "?" + queryParams : ""}`);
};

/**
 * Lấy thống kê producer với filter topic
 * Backend: GET /api/producers/statistics?topic=xxx
 * @param {string} topic - Tên topic (optional)
 */
export const getProducerStatistics = (topic = null) => {
  const queryParams = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return callApi(`producers/statistics${queryParams}`);
};

/**
 * Đánh dấu log đã được consumed
 * Backend: PATCH /api/producers/logs/:id/consumed
 * @param {string} logId - ID của log
 */
export const markLogAsConsumed = (logId) => {
  return callApi(`producers/logs/${logId}/consumed`, {
    method: "PATCH",
  });
};

/**
 * Đánh dấu log lỗi khi consume
 * Backend: PATCH /api/producers/logs/:id/consume-failed
 * @param {string} logId - ID của log
 * @param {string} error - Thông tin lỗi
 */
export const markLogAsConsumeFailed = (logId, error) => {
  return callApi(`producers/logs/${logId}/consume-failed`, {
    method: "PATCH",
    body: JSON.stringify({ error }),
  });
};

// ============================================
// === CONSUMER APIs ===
// ============================================

/**
 * Lấy danh sách consumer logs với pagination và filter (giống Producer Logs)
 * Backend: GET /api/consumers/logs
 * @param {Object} params - { page?, limit?, topic?, consumerId?, status? }
 */
export const getConsumerLogs = (params = {}) => {
  const queryParams = new URLSearchParams(params).toString();
  return callApi(
    `consumers/logs${queryParams ? "?" + queryParams : ""}`,
    {},
    CONSUMER_API_BASE_URL
  );
};

/**
 * Lấy consumer log chi tiết theo ID
 * Backend: GET /api/consumers/logs/:id
 * @param {string} logId - ID của consumer log
 */
export const getConsumerLogById = (logId) => {
  return callApi(`consumers/logs/${logId}`, {}, CONSUMER_API_BASE_URL);
};

/**
 * Lấy consumer log theo originalLogId (producer ID) - trace
 * Backend: GET /api/consumers/logs/search/:originalLogId
 * @param {string} originalLogId - Original Log ID từ producer
 */
export const getConsumerLogsByOriginalId = (originalLogId) => {
  return callApi(
    `consumers/logs/search/${originalLogId}`,
    {},
    CONSUMER_API_BASE_URL
  );
};

/**
 * Lấy consumer stats với filter topic
 * Backend: GET /api/consumers/stats?topic=xxx
 * @param {string} topic - Tên topic (optional)
 */
export const getConsumerStats = (topic = null) => {
  const queryParams = topic ? `?topic=${encodeURIComponent(topic)}` : "";
  return callApi(`consumers/stats${queryParams}`, {}, CONSUMER_API_BASE_URL);
};

// ============================================
// === CONSUMER MANAGEMENT APIs ===
// ============================================

/**
 * Tạo consumer mới
 * Backend: POST /api/admin/consumers
 * @param {string} consumerId - Consumer ID (optional, auto-generate nếu không truyền)
 * @param {string} groupId - Kafka consumer group ID (optional)
 * @param {string} topicName - Topic name to subscribe (optional)
 */
export const createConsumer = (
  consumerId = null,
  groupId = null,
  topicName = null
) => {
  return callApi("admin/consumers", {
    method: "POST",
    body: JSON.stringify({
      consumerId,
      groupId,
      topicName,
    }),
  });
};

/**
 * Lấy danh sách consumers đang chạy
 * Backend: GET /api/admin/consumers
 */
export const getRunningConsumers = () => {
  return callApi("admin/consumers");
};

/**
 * Stop một consumer (chuyển status từ ACTIVE sang INACTIVE)
 * Backend: PUT /api/consumers/instances/:consumerId/stop
 * @param {string} consumerId - Consumer ID cần stop
 */
export const stopConsumer = (consumerId) => {
  return callApi(
    `consumers/instances/${consumerId}/stop`,
    {
      method: "PUT",
    },
    CONSUMER_API_BASE_URL
  );
};

/**
 * Resume một consumer (chuyển status từ INACTIVE sang ACTIVE)
 * Backend: PUT /api/consumers/instances/:consumerId/resume
 * @param {string} consumerId - Consumer ID cần resume
 */
export const resumeConsumer = (consumerId) => {
  return callApi(
    `consumers/instances/${consumerId}/resume`,
    {
      method: "PUT",
    },
    CONSUMER_API_BASE_URL
  );
};

/**
 * Delete một consumer (xóa hoàn toàn khỏi database)
 * Backend: DELETE /api/consumers/instances/:consumerId
 * @param {string} consumerId - Consumer ID cần xóa
 */
export const deleteConsumer = (consumerId) => {
  return callApi(
    `consumers/instances/${consumerId}`,
    {
      method: "DELETE",
    },
    CONSUMER_API_BASE_URL
  );
};
