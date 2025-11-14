<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center space-x-3">
        <button
          @click="$router.push('/')"
          class="text-blue-600 hover:text-blue-800 transition"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1 class="text-3xl font-bold">📤Quản lý Producer</h1>
        
        <!-- WebSocket Status Indicator -->
        <div class="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100 text-sm">
          <div
            class="w-2 h-2 rounded-full animate-pulse"
            :class="{
              'bg-green-500': socketConnectionStatus === 'connected',
              'bg-yellow-500': socketConnectionStatus === 'connecting',
              'bg-red-500': socketConnectionStatus === 'disconnected',
            }"
          ></div>
          <span
            class="font-medium"
            :class="{
              'text-green-600': socketConnectionStatus === 'connected',
              'text-yellow-600': socketConnectionStatus === 'connecting',
              'text-red-600': socketConnectionStatus === 'disconnected',
            }"
          >
            {{ socketConnectionStatus === 'connected' ? '🟢 Live' : socketConnectionStatus === 'connecting' ? '🟡 Connecting' : '🔴 Offline' }}
          </span>
        </div>
      </div>
      <button
        @click="fetchProducerData"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
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
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Refresh</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>

    <div v-else>
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-gray-600">Total Records Sent</p>
            <svg
              class="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <p class="text-3xl font-bold text-blue-600">
            {{ formatNumber(statistics.summary.totalRecords) }}
          </p>
        </div>

        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-gray-600">Total Batches</p>
            <svg
              class="w-8 h-8 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p class="text-3xl font-bold text-purple-600">
            {{ formatNumber(statistics.summary.totalBatches) }}
          </p>
        </div>

        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-gray-600">Success Rate</p>
            <svg
              class="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-3xl font-bold text-green-600">{{ successRate }}%</p>
        </div>

        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm text-gray-600">Failed Logs</p>
            <svg
              class="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p class="text-3xl font-bold text-red-600">
            {{ formatNumber(statistics.summary.failedLogs) }}
          </p>
        </div>
      </div>

      <!-- Statistics by Topic -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
          <svg
            class="w-6 h-6 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          Statistics by Topic
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Topic
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Records
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Batches
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Completed
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Failed
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Success Rate
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Avg Duration
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="topic in statistics.byTopic"
                :key="topic.topic"
                class="hover:bg-gray-50 transition"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-semibold text-blue-600">{{
                    topic.topic
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ formatNumber(topic.totalRecords) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ formatNumber(topic.totalBatches) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-green-600 font-medium">{{
                    topic.completed
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-red-600 font-medium">{{
                    topic.failed
                  }}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="
                      getSuccessRateClass(calculateTopicSuccessRate(topic))
                    "
                  >
                    {{ calculateTopicSuccessRate(topic) }}%
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{
                    topic.averageDuration
                      ? Math.round(topic.averageDuration)
                      : 0
                  }}ms
                </td>
              </tr>
              <tr v-if="!statistics.byTopic || statistics.byTopic.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                  No topic data available
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Producer Logs -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold mb-4 flex items-center">
          <svg
            class="w-6 h-6 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Producer Logs
        </h2>

        <!-- Search by ID -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-semibold mb-3">🔍 Tìm Log theo ID</h3>
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
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {{ searching ? "Đang tìm..." : "Tìm kiếm" }}
            </button>
          </div>
        </div>

        <!-- All Logs Table -->
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold">Tất cả Logs</h3>
          <div class="flex gap-4 items-center">
            <select
              v-model="filterType"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="fetchAllLogs"
            >
              <option value="">Tất cả loại</option>
              <option value="SINGLE">Single</option>
              <option value="FILE">File</option>
            </select>
            <button
              @click="fetchAllLogs"
              :disabled="loadingLogs"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {{ loadingLogs ? "Đang tải..." : "Refresh" }}
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loadingLogs" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Logs Table with Fixed Height and Scroll -->
        <div v-else class="border border-gray-200 rounded-lg overflow-hidden" style="height: 600px; display: flex; flex-direction: column;">
          <!-- Table Header - Fixed -->
          <div class="bg-gray-50 border-b border-gray-200">
            <table class="min-w-full table-fixed">
              <thead>
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style="width: 15%;">ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style="width: 10%;">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style="width: 12%;">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style="width: 15%;">Topic</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style="width: 20%;">File Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style="width: 18%;">Created</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase" style="width: 10%;">Actions</th>
                </tr>
              </thead>
            </table>
          </div>
          
          <!-- Table Body - Scrollable -->
          <div class="overflow-y-auto flex-1 bg-white">
            <table class="min-w-full table-fixed">
              <tbody class="divide-y divide-gray-200">
                <tr v-for="log in allLogs" :key="log.id" class="hover:bg-gray-50 transition">
                  <td class="px-6 py-4 text-sm font-mono text-gray-900 truncate" style="width: 15%;">
                    {{ log.id.substring(0, 8) }}...
                  </td>
                  <td class="px-6 py-4" style="width: 10%;">
                    <span
                      class="px-2 py-1 text-xs rounded"
                      :class="log.type === 'SINGLE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
                    >
                      {{ log.type }}
                    </span>
                  </td>
                  <td class="px-6 py-4" style="width: 12%;">
                    <span class="px-2 py-1 text-xs rounded" :class="getStatusClass(log.status)">
                      {{ log.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900 truncate" style="width: 15%;">{{ log.topic || "N/A" }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500 truncate" style="width: 20%;">{{ log.originalFileName || "-" }}</td>
                  <td class="px-6 py-4 text-sm text-gray-500" style="width: 18%;">{{ formatDate(log.createdAt) }}</td>
                  <td class="px-6 py-4" style="width: 10%;">
                    <button
                      @click="viewLogDetails(log.id)"
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
                <tr v-if="!allLogs.length">
                  <td colspan="7" class="text-center py-12 text-gray-500">
                    Không có logs nào
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination Info -->
        <div v-if="pagination" class="mt-4 text-sm text-gray-600 text-center">
          Hiển thị {{ allLogs.length }} / {{ pagination.total }} logs 
          (Trang {{ pagination.page }} / {{ pagination.totalPages }})
        </div>
      </div>

      <!-- Log Detail Modal -->
      <div
        v-if="selectedLog"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="closeLogDetail"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          <!-- Modal Header - Fixed -->
          <div class="bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-lg">
            <h3 class="text-2xl font-bold text-gray-800">
              📋 Chi tiết Log
            </h3>
            <button
              @click="closeLogDetail"
              class="text-gray-500 hover:text-gray-700 transition"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- Modal Body - Scrollable -->
          <div class="p-6 overflow-y-auto flex-1">
            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div class="bg-gray-50 p-4 rounded-lg">
                <span class="text-xs font-medium text-gray-500 uppercase block mb-1">ID</span>
                <span class="text-sm font-mono text-gray-900 break-all">{{ selectedLog.id }}</span>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Type</span>
                <span 
                  class="inline-block px-3 py-1 rounded text-sm font-medium"
                  :class="selectedLog.type === 'SINGLE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'"
                >
                  {{ selectedLog.type }}
                </span>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Status</span>
                <span class="inline-block px-3 py-1 rounded text-sm font-medium" :class="getStatusClass(selectedLog.status)">
                  {{ selectedLog.status }}
                </span>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Topic</span>
                <span class="text-sm text-gray-900 font-medium">{{ selectedLog.topic || "N/A" }}</span>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg col-span-2">
                <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Original File Name</span>
                <span class="text-sm text-gray-900">{{ selectedLog.originalFileName || "N/A" }}</span>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Created At</span>
                <span class="text-sm text-gray-900">{{ formatDate(selectedLog.createdAt) }}</span>
              </div>
              
              <div class="bg-gray-50 p-4 rounded-lg">
                <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Updated At</span>
                <span class="text-sm text-gray-900">{{ formatDate(selectedLog.updatedAt) }}</span>
              </div>
            </div>

            <!-- Error Message -->
            <div v-if="selectedLog.errorMessage" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-red-800 mb-1">Error Message</h4>
                  <p class="text-sm text-red-700">{{ selectedLog.errorMessage }}</p>
                </div>
              </div>
            </div>
            
            <!-- Data Preview -->
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span class="text-sm font-medium text-white">📄 Data Content</span>
                <button 
                  @click="copyToClipboard(formatLogData(selectedLog.parsedData))"
                  class="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                >
                  Copy
                </button>
              </div>
              <pre class="p-4 bg-gray-900 text-green-400 overflow-auto text-xs leading-relaxed" style="max-height: 400px;">{{ formatLogData(selectedLog.parsedData) }}</pre>
            </div>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script>
import { getProducerStatistics, getProducerLogs } from "@/services/apiService";
import { io } from "socket.io-client";
import { useToast } from "@/composables/useToast";

export default {
  name: "ProducerDashboardView",
  setup() {
    const { success, error } = useToast();
    return { toastSuccess: success, toastError: error };
  },
  data() {
    return {
      loading: true,
      loadingLogs: false,
      statistics: {
        summary: {
          totalRecords: 0,
          totalBatches: 0,
          completedLogs: 0,
          failedLogs: 0,
          totalLogs: 0,
        },
        byTopic: [],
      },
      allLogs: [],
      pagination: null,
      filterType: '',
      searchId: '',
      searching: false,
      selectedLog: null,
      socket: null,
      socketConnectionStatus: "connecting",
      refreshInterval: null,
      updateInterval: 30000, // Giảm polling xuống 30 giây vì có WebSocket
    };
  },
  computed: {
    successRate() {
      if (this.statistics.summary.totalLogs === 0) return 0;
      return Math.round(
        (this.statistics.summary.completedLogs /
          this.statistics.summary.totalLogs) *
          100
      );
    },
  },
  async mounted() {
    await this.fetchProducerData();
    await this.fetchAllLogs();
    
    // Khởi tạo WebSocket để nhận realtime updates
    this.initializeWebSocket();
    
    // Backup polling mỗi 30 giây (phòng trường hợp WebSocket fail)
    this.refreshInterval = setInterval(() => {
      this.fetchProducerData();
      this.fetchAllLogs();
    }, this.updateInterval);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.socket) {
      this.socket.disconnect();
      console.log("Producer WebSocket disconnected");
    }
  },
  methods: {
    // ✅ Khởi tạo WebSocket connection đến Producer Service
    initializeWebSocket() {
      console.log("🔌 [Producer] Initializing WebSocket connection...");

      // Kết nối đến Producer Service (Port 3000)
      this.socket = io("http://localhost:3000", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        timeout: 20000,
        autoConnect: true,
      });

      // ✅ Sự kiện kết nối thành công
      this.socket.on("connect", () => {
        console.log("✅ [Producer] WebSocket connected!");
        console.log("Socket ID:", this.socket.id);
        this.socketConnectionStatus = "connected";
      });

      // ✅ Sự kiện connection error
      this.socket.on("connect_error", (error) => {
        console.error("❌ [Producer] WebSocket connection error:", error);
        this.socketConnectionStatus = "disconnected";
      });

      // ✅ Sự kiện disconnect
      this.socket.on("disconnect", (reason) => {
        console.log("🔌 [Producer] WebSocket disconnected:", reason);
        this.socketConnectionStatus = "disconnected";
      });

      // ✅ Sự kiện reconnect
      this.socket.on("reconnect", (attemptNumber) => {
        console.log(`🔄 [Producer] WebSocket reconnected after ${attemptNumber} attempts`);
        this.socketConnectionStatus = "connected";
        // Refresh data sau khi reconnect
        this.fetchProducerData();
        this.fetchAllLogs();
      });

      // 📨 Lắng nghe event log mới được tạo
      this.socket.on("producer-log-created", (data) => {
        console.log("📨 [Producer] New log created:", data);
        // Thêm log mới vào đầu danh sách
        if (data.log) {
          this.allLogs.unshift(data.log);
          // Giới hạn số lượng logs hiển thị
          if (this.allLogs.length > 50) {
            this.allLogs.pop();
          }
        }
        // Refresh statistics
        this.fetchProducerData();
      });

      // 📨 Lắng nghe event log được update
      this.socket.on("producer-log-updated", (data) => {
        console.log("📨 [Producer] Log updated:", data);
        if (data.logId) {
          // Tìm và update log trong danh sách
          const index = this.allLogs.findIndex(log => log.id === data.logId);
          if (index !== -1 && data.log) {
            this.allLogs[index] = data.log;
          }
        }
        // Refresh statistics
        this.fetchProducerData();
      });

      // 📨 Lắng nghe event statistics update
      this.socket.on("producer-stats-updated", (data) => {
        console.log("📨 [Producer] Stats updated:", data);
        if (data.statistics) {
          this.statistics = data.statistics;
        }
      });
    },

    async fetchProducerData() {
      try {
        const statsResponse = await getProducerStatistics();

        if (statsResponse.success) {
          this.statistics = {
            summary: statsResponse.summary || {
              totalRecords: 0,
              totalBatches: 0,
              completedLogs: 0,
              failedLogs: 0,
              totalLogs: 0,
            },
            byTopic: statsResponse.byTopic || [],
          };
        }
      } catch (error) {
        console.error("Error fetching producer data:", error);
      } finally {
        this.loading = false;
      }
    },
    
    async fetchAllLogs() {
      this.loadingLogs = true;
      try {
        const params = {
          page: 1,
          limit: 50,
        };
        if (this.filterType) {
          params.type = this.filterType;
        }

        const response = await getProducerLogs(params);
        
        if (response.success) {
          this.allLogs = response.data || [];
          this.pagination = response.pagination;
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        this.loadingLogs = false;
      }
    },

    async searchLogById() {
      if (!this.searchId) return;

      this.searching = true;
      
      try {
        const response = await this.getProducerLogById(this.searchId);
        
        if (response.success) {
          this.selectedLog = response.data;
        } else {
          this.toastError(response.message || 'Không tìm thấy log');
        }
      } catch (error) {
        console.error("Error searching log:", error);
        this.toastError('Có lỗi xảy ra khi tìm kiếm');
      } finally {
        this.searching = false;
      }
    },

    async getProducerLogById(logId) {
      try {
        const response = await fetch(`http://localhost:3000/api/producers/logs/${logId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          // Parse data field
          try {
            data.data.parsedData = JSON.parse(data.data.data || '{}');
          } catch (e) {
            data.data.parsedData = data.data.data;
          }
        }
        
        return data;
      } catch (error) {
        throw error;
      }
    },

    viewLogDetails(logId) {
      this.searchId = logId;
      this.searchLogById();
    },

    closeLogDetail() {
      this.selectedLog = null;
      this.searchId = '';
    },

    getStatusClass(status) {
      const classes = {
        PENDING: "bg-yellow-100 text-yellow-800",
        PROCESSING: "bg-blue-100 text-blue-800",
        COMPLETED: "bg-green-100 text-green-800",
        FAILED: "bg-red-100 text-red-800",
      };
      return classes[status] || "bg-gray-100 text-gray-800";
    },

    formatLogData(data) {
      return JSON.stringify(data, null, 2);
    },
    
    copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        this.toastSuccess('Đã copy vào clipboard!');
      }).catch(err => {
        console.error('Failed to copy:', err);
        this.toastError('Không thể copy');
      });
    },
    
    calculateTopicSuccessRate(topic) {
      const total = topic.completed + topic.failed;
      if (total === 0) return 0;
      return Math.round((topic.completed / total) * 100);
    },
    getSuccessRateClass(rate) {
      if (rate >= 95) return "text-green-600 font-bold";
      if (rate >= 80) return "text-yellow-600 font-bold";
      return "text-red-600 font-bold";
    },
    formatNumber(num) {
      return num?.toLocaleString() || 0;
    },
    formatDate(date) {
      if (!date) return "N/A";
      const d = new Date(date);
      return d.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>
