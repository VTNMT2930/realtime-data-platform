<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-3xl font-bold mb-2">🔍 Debug Producer Logs</h1>
      <p class="text-gray-600">Kiểm tra chi tiết logs của Producer</p>
    </div>

    <!-- Search by ID -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Tìm Log theo ID</h2>
      <div class="flex gap-4">
        <input
          v-model="searchId"
          type="text"
          placeholder="Nhập Log ID..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="searchLogById"
        />
        <button
          @click="searchLogById"
          :disabled="!searchId || searching"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ searching ? "Đang tìm..." : "Tìm kiếm" }}
        </button>
      </div>

      <!-- Search Result -->
      <div v-if="searchResult" class="mt-4">
        <div
          v-if="searchResult.success"
          class="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <h3 class="font-semibold text-green-800 mb-2">✅ Tìm thấy log:</h3>
          <div class="space-y-2 text-sm">
            <div>
              <span class="font-medium">ID:</span> {{ searchResult.data.id }}
            </div>
            <div>
              <span class="font-medium">Type:</span>
              <span class="px-2 py-1 rounded bg-blue-100 text-blue-800">{{
                searchResult.data.type
              }}</span>
            </div>
            <div>
              <span class="font-medium">Status:</span>
              <span
                class="px-2 py-1 rounded"
                :class="getStatusClass(searchResult.data.status)"
              >
                {{ searchResult.data.status }}
              </span>
            </div>
            <div>
              <span class="font-medium">Topic:</span>
              {{ searchResult.data.topic || "N/A" }}
            </div>
            <div>
              <span class="font-medium">Original File Name:</span>
              {{ searchResult.data.originalFileName || "N/A" }}
            </div>
            <div>
              <span class="font-medium">Created At:</span>
              {{ formatDate(searchResult.data.createdAt) }}
            </div>
            <div>
              <span class="font-medium">Updated At:</span>
              {{ formatDate(searchResult.data.updatedAt) }}
            </div>
            <div v-if="searchResult.data.errorMessage" class="text-red-600">
              <span class="font-medium">Error:</span>
              {{ searchResult.data.errorMessage }}
            </div>
            <div class="pt-2 border-t border-green-200">
              <span class="font-medium">Data:</span>
              <pre
                class="mt-2 p-3 bg-gray-800 text-green-400 rounded overflow-auto max-h-96"
                >{{
                  JSON.stringify(searchResult.data.parsedData, null, 2)
                }}</pre
              >
            </div>
          </div>
        </div>
        <div v-else class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800">❌ {{ searchResult.message }}</p>
        </div>
      </div>
    </div>

    <!-- All Logs -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold">Tất cả Logs</h2>
        <div class="flex gap-4 items-center">
          <select
            v-model="filterType"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="fetchLogs"
          >
            <option value="">Tất cả loại</option>
            <option value="SINGLE">Single</option>
            <option value="FILE">File</option>
          </select>
          <button
            @click="fetchLogs"
            :disabled="loading"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? "Đang tải..." : "Refresh" }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
        ></div>
      </div>

      <!-- Logs Table -->
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                ID
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Topic
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                File Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Created
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm font-mono text-gray-900">
                {{ log.id.substring(0, 8) }}...
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-xs rounded"
                  :class="
                    log.type === 'SINGLE'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  "
                >
                  {{ log.type }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-xs rounded"
                  :class="getStatusClass(log.status)"
                >
                  {{ log.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ log.topic || "N/A" }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ log.originalFileName || "-" }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="px-6 py-4">
                <button
                  @click="viewLogDetails(log.id)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!logs.length" class="text-center py-12 text-gray-500">
          Không có logs nào
        </div>
      </div>

      <!-- Pagination Info -->
      <div v-if="pagination" class="mt-4 text-sm text-gray-600 text-center">
        Hiển thị {{ logs.length }} / {{ pagination.total }} logs (Trang
        {{ pagination.page }} / {{ pagination.totalPages }})
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { getProducerLogs, getProducerLogById } from "@/services/apiService";

export default {
  name: "DebugLogsView",
  setup() {
    const logs = ref([]);
    const loading = ref(false);
    const pagination = ref(null);
    const filterType = ref("");

    const searchId = ref("");
    const searching = ref(false);
    const searchResult = ref(null);

    const fetchLogs = async () => {
      loading.value = true;
      try {
        const params = {
          page: 1,
          limit: 50,
        };
        if (filterType.value) {
          params.type = filterType.value;
        }

        const response = await getProducerLogs(params);
        console.log("📊 Response from API:", response);

        if (response.success) {
          logs.value = response.data || [];
          pagination.value = response.pagination;
        }
      } catch (error) {
        console.error("❌ Error fetching logs:", error);
      } finally {
        loading.value = false;
      }
    };

    const searchLogById = async () => {
      if (!searchId.value) return;

      searching.value = true;
      searchResult.value = null;

      try {
        const response = await getProducerLogById(searchId.value);
        console.log("🔍 Search result:", response);
        searchResult.value = response;
      } catch (error) {
        console.error("❌ Error searching log:", error);
        searchResult.value = {
          success: false,
          message: error.message || "Có lỗi xảy ra khi tìm kiếm",
        };
      } finally {
        searching.value = false;
      }
    };

    const viewLogDetails = (logId) => {
      searchId.value = logId;
      searchLogById();
    };

    const getStatusClass = (status) => {
      const classes = {
        PENDING: "bg-yellow-100 text-yellow-800",
        PROCESSING: "bg-blue-100 text-blue-800",
        COMPLETED: "bg-green-100 text-green-800",
        FAILED: "bg-red-100 text-red-800",
      };
      return classes[status] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleString("vi-VN");
    };

    onMounted(() => {
      fetchLogs();
    });

    return {
      logs,
      loading,
      pagination,
      filterType,
      searchId,
      searching,
      searchResult,
      fetchLogs,
      searchLogById,
      viewLogDetails,
      getStatusClass,
      formatDate,
    };
  },
};
</script>
