<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-semibold text-gray-900">
        Bảng theo dõi trạng thái Consumer
      </h2>
      <button
        @click="fetchConsumerStats"
        class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        <svg
          class="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Làm mới
      </button>
    </div>

    <!-- Error Alert -->
    <div
      v-if="error"
      class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <p class="text-sm text-red-800">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>

    <!-- Table -->
    <div v-if="!loading" class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Consumer Group
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Topic đã Subscribe
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Trạng thái
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Lag
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Hành động
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="consumer in consumers"
            :key="consumer.id"
            class="hover:bg-gray-50"
          >
            <!-- Consumer Group -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">
                {{ consumer.groupName }}
              </div>
            </td>

            <!-- Topic đã Subscribe -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm text-gray-500">{{ consumer.topic }}</div>
            </td>

            <!-- Trạng thái -->
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-3 py-1 text-xs font-medium rounded-full"
                :class="getStatusClass(consumer.status)"
              >
                {{ consumer.status }}
              </span>
            </td>

            <!-- Tiến trình/Lag -->
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    class="bg-blue-600 h-2 rounded-full"
                    :style="{ width: consumer.progress + '%' }"
                  ></div>
                </div>
                <span class="text-sm text-gray-700 font-medium">{{
                  consumer.progress
                }}</span>
              </div>
            </td>

            <!-- Hành động -->
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button
                @click="editConsumer(consumer)"
                class="text-blue-600 hover:text-blue-900 font-medium"
              >
                Edit
              </button>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="consumers.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-gray-500">
              Chưa có consumer group nào. Hãy tạo consumer group mới.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-center">
      <nav class="flex items-center space-x-2">
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

    <!-- Create/Edit Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div class="p-6">
          <h3 class="text-xl font-semibold text-gray-900">
            Tạo Consumer Group mới
          </h3>
        </div>
        <form @submit.prevent="handleCreateConsumer">
          <div class="p-6 border-t border-b border-gray-200 space-y-4">
            <div>
              <label
                for="groupName"
                class="block text-sm font-medium text-gray-700"
                >Tên Consumer Group</label
              >
              <input
                v-model="form.groupName"
                type="text"
                id="groupName"
                required
                class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: ConsumerGroup-A"
              />
            </div>
            <div>
              <label for="topic" class="block text-sm font-medium text-gray-700"
                >Topic để Subscribe</label
              >
              <input
                v-model="form.topic"
                type="text"
                id="topic"
                required
                class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="VD: orders_topic"
              />
            </div>
          </div>
          <div class="flex justify-end p-6 space-x-4 bg-gray-50 rounded-b-lg">
            <button
              @click="showCreateModal = false"
              type="button"
              class="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { PlusIcon } from "@heroicons/vue/24/outline";
import { getConsumerLogs, getConsumerStats } from "@/services/apiService";

const showCreateModal = ref(false);
const currentPage = ref(1);
const itemsPerPage = 10;
const loading = ref(false);
const error = ref(null);

// Consumer logs data
const consumerLogs = ref([]);
const consumerStats = ref(null);

// Fetch consumer logs
const fetchConsumerLogs = async (filters = {}) => {
  loading.value = true;
  error.value = null;

  try {
    const response = await getConsumerLogs(filters);
    consumerLogs.value = response.logs || [];
  } catch (err) {
    error.value = "Không thể tải dữ liệu consumer logs";
    console.error("Error fetching consumer logs:", err);
  } finally {
    loading.value = false;
  }
};

// Fetch consumer stats
const fetchConsumerStats = async () => {
  try {
    const response = await getConsumerStats();
    consumerStats.value = response;
  } catch (err) {
    console.error("Error fetching consumer stats:", err);
  }
};

// Transform consumer stats to display format
const consumers = computed(() => {
  // ✅ Dùng byTopic thay vì consumers
  if (!consumerStats.value?.byTopic) {
    return [];
  }

  return consumerStats.value.byTopic.map((topicStat, index) => ({
    id: `${topicStat.topic}-${index}`,
    groupName: "LENOVO-IDEAPAD5", // Consumer group mặc định
    topic: topicStat.topic || "Multiple",
    status: getStatusFromTopicStats(topicStat),
    progress: topicStat.successRate || 0,
  }));
});

// Get status from topic stats
const getStatusFromTopicStats = (topicStat) => {
  if (topicStat.failed > 0 && topicStat.processed === 0) return "Lỗi";
  if (topicStat.processed > 0) return "Hoàn thành";
  return "Ngủ";
};

const form = ref({
  groupName: "",
  topic: "",
});

// Pagination
const totalPages = computed(() => {
  return Math.ceil(consumers.value.length / itemsPerPage) || 1;
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

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

// Status classes
const getStatusClass = (status) => {
  const classes = {
    "Đang chạy": "bg-green-100 text-green-800",
    Rebalancing: "bg-yellow-100 text-yellow-800",
    Ngủ: "bg-gray-100 text-gray-800",
    Lỗi: "bg-red-100 text-red-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
};

// Actions
const handleCreateConsumer = () => {
  console.log("Creating consumer:", form.value);
  // TODO: Call API to create consumer

  // Add to list (mock)
  consumers.value.push({
    id: Date.now(),
    groupName: form.value.groupName,
    topic: form.value.topic,
    status: "Đang chạy",
    progress: 0,
  });

  // Reset form
  form.value = { groupName: "", topic: "" };
  showCreateModal.value = false;
};

const editConsumer = (consumer) => {
  console.log("Editing consumer:", consumer);
  // TODO: Implement edit functionality
};

// Load data on mount
onMounted(() => {
  fetchConsumerLogs();
  fetchConsumerStats();

  // Auto refresh every 5 seconds
  setInterval(() => {
    fetchConsumerStats();
  }, 5000);
});
</script>
