<template>
  <!-- *** FIX: Remove redundant padding/shadow, MainLayout handles this *** -->
  <div>
    <!-- Modal Gửi Message -->
    <ProduceMessageModal
      v-if="showProduceModal"
      @close="showProduceModal = false"
      @success="handleMessageSuccess"
    />

    <!-- Modal Sửa Topic -->
    <UpdateTopicModal
      v-if="showUpdateTopicModal"
      :topicName="topicName"
      :currentPartitions="currentPartitions"
      :loading="kafkaStore.loading"
      @close="showUpdateTopicModal = false"
      @save="handleUpdateTopic"
    />

    <!-- Modal Xóa Topic -->
    <DeleteTopicModal
      v-if="showDeleteTopicModal"
      :topicName="topicName"
      :loading="kafkaStore.loading"
      @close="showDeleteTopicModal = false"
      @confirm="handleDeleteTopic"
    />

    <!-- Header (Breadcrumb và Nút) -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center">
        <!-- *** FIX: Update "Back" button path *** -->
        <router-link
          to="/configuration/topics"
          class="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon class="w-6 h-6" />
        </router-link>
        <h2 class="ml-3 text-2xl font-semibold text-gray-900">
          Topics / <span class="text-blue-600">{{ topicName }}</span>
        </h2>
      </div>
      <div class="flex items-center space-x-3">
        <button
          @click="showUpdateTopicModal = true"
          class="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50"
        >
          <PencilSquareIcon class="w-5 h-5 mr-2" />
          Cấu hình
        </button>
        <button
          @click="showDeleteTopicModal = true"
          class="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded-lg hover:bg-red-50"
        >
          <TrashIcon class="w-5 h-5 mr-2" />
          Xóa Topic
        </button>
        <button
          @click="showProduceModal = true"
          class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Produce Message
        </button>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="mt-4 border-b border-gray-200">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="activeTab = 'messages'"
          :class="[
            'py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'messages'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          ]"
        >
          Messages
        </button>
      </nav>
    </div>

    <!-- Nội dung Tab Messages -->
    <div v-if="activeTab === 'messages'" class="mt-6">
      <!-- Bộ lọc và Tìm kiếm -->
      <div class="mt-6">
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="grid grid-cols-1 gap-4 items-center md:grid-cols-12">
            <!-- Search column (left) -->
            <div class="md:col-span-9">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Tìm kiếm</label
              >
              <div class="relative">
                <div
                  class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
                >
                  <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  v-model="searchQuery"
                  class="block w-full py-2 pl-10 pr-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Tìm theo Offset, Partition, Message..."
                />
              </div>
            </div>

            <!-- Status column (right) -->
            <div class="md:col-span-3">
              <label class="block text-sm font-medium text-gray-700 mb-2"
                >Trạng thái</label
              >
              <select
                v-model="statusFilter"
                class="block w-full p-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Thành công">Thành công</option>
                <option value="Đang xử lý">Đang xử lý</option>
                <option value="Thất bại">Thất bại</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <!-- Bảng Messages -->
      <div class="mt-4 overflow-x-auto bg-white rounded-lg shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="header in messageHeaders"
                :key="header"
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <!-- *** FIX: Use computed data from Pinia store *** -->
            <tr v-for="msg in currentTopicMessages" :key="msg.offset">
              <td
                class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap text-center"
              >
                {{ msg.offset }}
              </td>
              <td
                class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center"
              >
                {{ msg.partition }}
              </td>
              <td
                class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center"
              >
                {{ msg.startTime }}
              </td>
              <td
                class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center"
              >
                {{ msg.endTime }}
              </td>
              <td
                class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center"
              >
                {{ msg.duration }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span
                  class="px-3 py-1 text-xs font-medium rounded-full"
                  :class="getStatusClass(msg.status)"
                >
                  {{ msg.status }}
                </span>
              </td>
              <td
                class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap font-mono text-center"
              >
                {{ msg.message }}
              </td>
            </tr>
            <!-- *** FIX: Add empty state *** -->
            <tr v-if="currentTopicMessages.length === 0">
              <td
                :colspan="messageHeaders.length"
                class="px-6 py-12 text-center text-gray-500"
              >
                Không tìm thấy message nào cho topic này.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex items-center justify-center">
        <nav class="flex items-center space-x-2">
          <!-- Previous Button -->
          <button
            @click="previousPage"
            :disabled="currentPage === 1"
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-lg border transition-colors',
              currentPage === 1
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <!-- Page Numbers -->
          <button
            v-for="page in visiblePages"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors',
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            {{ page }}
          </button>

          <!-- Next Button -->
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            :class="[
              'flex items-center justify-center w-10 h-10 rounded-lg border transition-colors',
              currentPage === totalPages
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50',
            ]"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>

    <!-- Nội dung Tab Producer Logs -->
    <div v-if="activeTab === 'logs'" class="mt-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900">Producer Logs</h3>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500"
            >Tổng: {{ filteredLogs.length }} logs</span
          >
          <button
            @click="refreshLogs"
            :disabled="loading"
            class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-5 h-5 mr-2"
              :class="{ 'animate-spin': loading }"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            {{ loading ? "Đang tải..." : "Refresh" }}
          </button>
        </div>
      </div>

      <!-- Filter -->
      <div class="mb-4 flex items-center space-x-4">
        <div class="flex-1">
          <select
            v-model="statusFilter"
            class="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="CONSUMED">Consumed</option>
            <option value="CONSUME_FAILED">Failed</option>
          </select>
        </div>
        <div class="flex-1">
          <select
            v-model="typeFilter"
            class="block w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tất cả loại</option>
            <option value="SINGLE">Single Message</option>
            <option value="FILE">CSV File</option>
          </select>
        </div>
      </div>

      <!-- Logs Table -->
      <div class="overflow-x-auto bg-white rounded-lg shadow">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                File Name
              </th>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                Total Records
              </th>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                Success
              </th>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                Failed
              </th>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                Created At
              </th>
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
              >
                Error
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="log in filteredLogs"
              :key="log.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="
                    log.type === 'SINGLE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  "
                >
                  {{ log.type }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-3 py-1 text-xs font-medium rounded-full"
                  :class="getLogStatusClass(log.status)"
                >
                  {{ log.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {{ log.originalFileName || "-" }}
              </td>
              <td
                class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap text-center"
              >
                {{ log.totalRecords || "-" }}
              </td>
              <td
                class="px-6 py-4 text-sm text-green-600 whitespace-nowrap text-center"
              >
                {{ log.successCount || 0 }}
              </td>
              <td
                class="px-6 py-4 text-sm text-red-600 whitespace-nowrap text-center"
              >
                {{ log.failedCount || 0 }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {{ formatLogDate(log.createdAt) }}
              </td>
              <td class="px-6 py-4 text-sm text-red-600">
                <div
                  v-if="log.errorMessage"
                  class="max-w-xs truncate"
                  :title="log.errorMessage"
                >
                  {{ log.errorMessage }}
                </div>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="filteredLogs.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-gray-500">
                {{ loading ? "Đang tải..." : "Không có logs nào" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Nội dung Tab Consumers (Placeholder) -->
    <div
      v-if="activeTab === 'consumers'"
      class="mt-6 p-6 bg-white rounded-lg shadow"
    >
      <p>Danh sách consumer group cho topic này.</p>
    </div>

    <!-- Nội dung Tab Gửi tự động (Placeholder) -->
    <div
      v-if="activeTab === 'auto-send'"
      class="mt-6 p-6 bg-white rounded-lg shadow"
    >
      <p>Danh sách các job gửi tự động cho topic này.</p>
    </div>
  </div>
</template>

<script setup>
// *** FIX: Import Pinia and onMounted ***
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import { useKafkaStore } from "@/stores/kafkaStore";

import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
// *** FIX: Use alias path for consistency ***
import ProduceMessageModal from "@/components/common/ProduceMessageModal.vue";
import UpdateTopicModal from "@/components/common/UpdateTopicModal.vue";
import DeleteTopicModal from "@/components/common/DeleteTopicModal.vue";
import { useToast } from "@/composables/useToast";

const route = useRoute();
const router = useRouter();
const { success, error } = useToast();
const activeTab = ref("messages");
const showProduceModal = ref(false);
const showUpdateTopicModal = ref(false);
const showDeleteTopicModal = ref(false);
const currentPartitions = ref(null);

const topicName = computed(() => route.params.topicName);

// *** FIX: Setup Pinia Store ***
const kafkaStore = useKafkaStore();
// Get the 'messages' and 'logs' from the store
const { messages, logs, loading } = storeToRefs(kafkaStore);

// Filter state for messages
const searchQuery = ref("");
const statusFilter = ref("");

// Filter state for logs
const typeFilter = ref("");
let logsIntervalId = null;

// Pagination state
const currentPage = ref(1);
const itemsPerPage = ref(10);

// Get all messages for this topic
const allMessages = computed(() => {
  return messages.value[topicName.value] || [];
});

// Filtered messages based on search and status
const filteredMessages = computed(() => {
  let filtered = allMessages.value;

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((msg) => {
      return (
        msg.offset?.toString().toLowerCase().includes(query) ||
        msg.partition?.toString().toLowerCase().includes(query) ||
        msg.message?.toLowerCase().includes(query)
      );
    });
  }

  // Filter by status
  if (statusFilter.value) {
    filtered = filtered.filter((msg) => msg.status === statusFilter.value);
  }

  return filtered;
});

// Paginated messages
const currentTopicMessages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredMessages.value.slice(start, end);
});

// Total pages (based on filtered messages)
const totalPages = computed(() => {
  return Math.ceil(filteredMessages.value.length / itemsPerPage.value) || 1;
});

// Visible page numbers (show max 5 pages)
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 5) {
    // Show all pages if total is 5 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Show current page and 2 pages before/after
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    // Adjust if near the beginning or end
    if (current <= 3) {
      end = 5;
    } else if (current >= total - 2) {
      start = total - 4;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

// Pagination methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// Reset to page 1 when filters change
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1;
});

// Filtered logs based on status and type
const filteredLogs = computed(() => {
  let filtered = logs.value;

  if (statusFilter.value) {
    filtered = filtered.filter((log) => log.status === statusFilter.value);
  }

  if (typeFilter.value) {
    filtered = filtered.filter((log) => log.type === typeFilter.value);
  }

  return filtered;
});

// Refresh logs function
const refreshLogs = async () => {
  await kafkaStore.fetchLogs();
};

// Fetch messages when the component mounts
onMounted(async () => {
  kafkaStore.fetchMessages(topicName.value);

  // Also fetch logs when component mounts
  kafkaStore.fetchLogs();

  // Fetch topic detail to get current partitions
  try {
    const topicDetail = await kafkaStore.getTopicDetail(topicName.value);
    if (topicDetail?.data?.metadata?.partitions) {
      currentPartitions.value = topicDetail.data.metadata.partitions.length;
    }
  } catch (error) {
    console.error("Failed to fetch topic detail:", error);
  }

  // Setup polling for logs (every 5 seconds)
  logsIntervalId = setInterval(() => {
    if (activeTab.value === "logs") {
      kafkaStore.fetchLogs();
    }
  }, 5000);
});

// Clean up interval on unmount
onUnmounted(() => {
  if (logsIntervalId) {
    clearInterval(logsIntervalId);
  }
});

// Handle success after sending message
const handleMessageSuccess = async () => {
  // Refresh logs and messages
  await kafkaStore.fetchLogs();
  await kafkaStore.fetchMessages(topicName.value);
};

const handleUpdateTopic = async (updateData) => {
  try {
    console.log("View: Cập nhật topic:", topicName.value, updateData);
    const result = await kafkaStore.updateTopic(topicName.value, updateData);
    console.log("View: Cập nhật topic thành công:", result);

    // Đóng modal
    showUpdateTopicModal.value = false;

    // Hiển thị thông báo thành công
    success("Cập nhật topic thành công!");

    // Refresh topic detail
    const topicDetail = await kafkaStore.getTopicDetail(topicName.value);
    if (topicDetail?.data?.metadata?.partitions) {
      currentPartitions.value = topicDetail.data.metadata.partitions.length;
    }
  } catch (err) {
    console.error("View: Error in handleUpdateTopic:", err);
    error("Lỗi: " + err.message);
  }
};

const handleDeleteTopic = async () => {
  try {
    console.log("View: Xóa topic:", topicName.value);
    const result = await kafkaStore.deleteTopic(topicName.value);
    console.log("View: Xóa topic thành công:", result);

    // Đóng modal
    showDeleteTopicModal.value = false;

    // Hiển thị thông báo thành công
    success("Xóa topic thành công!");

    // Chuyển về trang danh sách topics
    router.push("/configuration/topics");
  } catch (err) {
    console.error("View: Error in handleDeleteTopic:", err);
    error("Lỗi: " + err.message);
  }
};

const messageHeaders = [
  "Offset",
  "Partition",
  "Thời gian bắt đầu",
  "Thời gian kết thúc",
  "Tổng thời gian",
  "Status",
  "Message",
];

const getStatusClass = (status) => {
  if (status === "Thành công") return "bg-green-100 text-green-800";
  if (status === "Đang xử lý") return "bg-blue-100 text-blue-800";
  if (status === "Thất bại") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

const getLogStatusClass = (status) => {
  const classes = {
    PENDING: "bg-yellow-100 text-yellow-800",
    SENT: "bg-blue-100 text-blue-800",
    CONSUMED: "bg-green-100 text-green-800",
    CONSUME_FAILED: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
};

const formatLogDate = (dateString) => {
  return new Date(dateString).toLocaleString("vi-VN");
};
</script>
