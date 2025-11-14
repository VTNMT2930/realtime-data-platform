<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-6">📊 Kafka Platform Overview</h1>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>

    <!-- Dashboard Content -->
    <div v-else>
      <!-- System Status -->
      <SystemStatus
        :activeConsumers="consumerStats.activeConsumers"
        :totalConsumers="consumerStats.totalConsumers"
        :autoRefresh="true"
      />
      
      <!-- Main Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Producer Card -->
        <!-- Producer Card -->
      <div
        class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition transform hover:scale-105"
        @click="$router.push('/producer-dashboard')"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">📤 Producer</h2>
          <svg
            class="w-10 h-10 opacity-80"
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
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="opacity-90">Total Sent</span>
            <span class="font-bold">{{
              formatNumber(producerStats.totalRecords)
            }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-90">Success Rate</span>
            <span class="font-bold">{{ producerStats.successRate }}%</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-90">Batches</span>
            <span class="font-bold">{{
              formatNumber(producerStats.totalBatches)
            }}</span>
          </div>
        </div>

        <div class="mt-4 text-sm opacity-75 flex items-center space-x-2">
          <span>Click to view details</span>
          <button
            @click.stop="$router.push('/producer-dashboard')"
            class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg text-sm transition backdrop-blur-sm"
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>

        <!-- Consumer Card -->
        <div
          class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition transform hover:scale-105"
        >
          <div class="flex items-center justify-between mb-4">
            <h2
              class="text-xl font-bold cursor-pointer"
              @click="$router.push('/consumer-dashboard')"
            >
              📥 Consumer
            </h2>
            <svg
              class="w-10 h-10 opacity-80"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8"
              />
            </svg>
          </div>
          <div
            class="space-y-2 cursor-pointer"
            @click="$router.push('/consumer-dashboard')"
          >
            <div class="flex justify-between">
              <span class="opacity-90">Total Consumed</span>
              <span class="font-bold">{{
                formatNumber(consumerStats.totalMessages)
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-90">Success Rate</span>
              <span class="font-bold">{{ consumerStats.successRate }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-90">Active</span>
              <span class="font-bold"
                >{{ consumerStats.activeConsumers }}/{{
                  consumerStats.totalConsumers
                }}</span
              >
            </div>
          </div>
<!-- Consumer Card -->
        <div class="mt-4 text-sm opacity-75 flex items-center space-x-2">
          <span>Click to view details</span>
          <button
            @click.stop="$router.push('/consumer-dashboard')"
            class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg text-sm transition backdrop-blur-sm"
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
        </div>

        <!-- Topics Card -->
      <div
        class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition transform hover:scale-105"
        @click="$router.push('configuration/topics')"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">🔖 Topics</h2>
          <svg
            class="w-10 h-10 opacity-80"
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
        </div>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span class="opacity-90">Total Topics</span>
            <span class="font-bold">{{ kafkaStats.totalTopics }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-90">Active</span>
            <span class="font-bold">{{ kafkaStats.activeTopics }}</span>
          </div>
          <div class="flex justify-between">
            <span class="opacity-90">Messages</span>
            <span class="font-bold">{{ formatNumber(totalMessages) }}</span>
          </div>
        </div>

        <div class="mt-4 text-sm opacity-75 flex items-center space-x-2">
          <span>Click to view details</span>
          <button
            @click.stop="$router.push('/configuration/topics')"
            class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg text-sm transition backdrop-blur-sm"
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
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Total Messages</p>
              <p class="text-3xl font-bold text-blue-600">
                {{ formatNumber(totalMessages) }}
              </p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <svg
                class="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Overall Success</p>
              <p class="text-3xl font-bold text-green-600">
                {{ overallSuccessRate }}%
              </p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <svg
                class="w-8 h-8 text-green-600"
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
          </div>
        </div>

        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Active Consumers</p>
              <p class="text-3xl font-bold text-purple-600">
                {{ consumerStats.activeConsumers }}
              </p>
            </div>
            <div class="bg-purple-100 rounded-full p-3">
              <svg
                class="w-8 h-8 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 mb-1">Failed Messages</p>
              <p class="text-3xl font-bold text-red-600">
                {{ formatNumber(totalFailed) }}
              </p>
            </div>
            <div class="bg-red-100 rounded-full p-3">
              <svg
                class="w-8 h-8 text-red-600"
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
          </div>
        </div>
      </div>

  
    </div>

    <!-- Add Consumer Modal -->
    <AddConsumerModal
      :isOpen="showAddConsumerModal"
      @close="closeAddConsumerModal"
      @consumer-created="handleConsumerCreated"
    />
  </div>
</template>

<script>
import { getProducerStatistics, getConsumerStats } from "@/services/apiService";
import AddConsumerModal from "@/components/common/AddConsumerModal.vue";
import SystemStatus from "@/components/common/SystemStatus.vue";
import { useToast } from "@/composables/useToast";

export default {
  name: "DashboardView",
  components: {
    AddConsumerModal,
    SystemStatus,
  },
  setup() {
    const { success } = useToast();
    return { toastSuccess: success };
  },
  data() {
    return {
      loading: true,
      showAddConsumerModal: false,
      producerStats: {
        totalRecords: 0,
        totalBatches: 0,
        successRate: 0,
        completedLogs: 0,
        failedLogs: 0,
        totalLogs: 0,
      },
      consumerStats: {
        totalMessages: 0,
        processedMessages: 0,
        failedMessages: 0,
        successRate: 0,
        activeConsumers: 0,
        totalConsumers: 0,
      },
      kafkaStats: {
        totalTopics: 0,
        activeTopics: 0,
      },
      refreshInterval: null,
    };
  },
  computed: {
    totalMessages() {
      return this.producerStats.totalRecords + this.consumerStats.totalMessages;
    },
    totalFailed() {
      return this.producerStats.failedLogs + this.consumerStats.failedMessages;
    },
    overallSuccessRate() {
      const total =
        this.producerStats.totalLogs + this.consumerStats.totalMessages;
      const success =
        this.producerStats.completedLogs + this.consumerStats.processedMessages;
      if (total === 0) return 0;
      return Math.round((success / total) * 100);
    },
  },
  async mounted() {
    await this.fetchAllStatistics();
    this.refreshInterval = setInterval(() => {
      this.fetchAllStatistics();
    }, 5000);
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async fetchAllStatistics() {
      try {
        const [producerResponse, consumerResponse] = await Promise.all([
          getProducerStatistics(),
          getConsumerStats(),
        ]);

        if (producerResponse.success) {
          const summary = producerResponse.summary;
          this.producerStats = {
            totalRecords: summary.totalRecords || 0,
            totalBatches: summary.totalBatches || 0,
            completedLogs: summary.completedLogs || 0,
            failedLogs: summary.failedLogs || 0,
            totalLogs: summary.totalLogs || 0,
            successRate:
              summary.totalLogs > 0
                ? Math.round((summary.completedLogs / summary.totalLogs) * 100)
                : 0,
          };
          this.kafkaStats.totalTopics = producerResponse.byTopic?.length || 0;
          this.kafkaStats.activeTopics =
            producerResponse.byTopic?.filter((t) => t.completed > 0).length ||
            0;
        }

        if (consumerResponse.success) {
          this.consumerStats = {
            totalMessages: consumerResponse.totalMessages || 0,
            processedMessages: consumerResponse.processedMessages || 0,
            failedMessages: consumerResponse.failedMessages || 0,
            activeConsumers: consumerResponse.activeConsumers || 0,
            totalConsumers: consumerResponse.totalConsumers || 0,
            successRate:
              consumerResponse.totalMessages > 0
                ? Math.round(
                    (consumerResponse.processedMessages /
                      consumerResponse.totalMessages) *
                      100
                  )
                : 0,
          };
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        this.loading = false;
      }
    },
    formatNumber(num) {
      return num?.toLocaleString() || 0;
    },
    openAddConsumerModal() {
      this.showAddConsumerModal = true;
    },
    closeAddConsumerModal() {
      this.showAddConsumerModal = false;
    },
    handleConsumerCreated(data) {
      console.log("Consumer created from dashboard:", data);
      // Refresh stats sau 5 giây
      setTimeout(() => {
        this.fetchStatistics();
      }, 5000);
      // Hiển thị thông báo thành công
      this.toastSuccess(
        `Consumer "${data.consumerId}" created successfully! Check Consumer Dashboard for details.`
      );
    },
  },
};
</script>
