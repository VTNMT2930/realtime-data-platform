<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold text-gray-800 flex items-center">
        <svg
          class="w-6 h-6 mr-2 text-orange-500"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"
          />
        </svg>
        System Status
      </h2>
      <button
        @click="checkAllStatus"
        class="text-sm text-gray-600 hover:text-gray-800 flex items-center"
      >
        <svg
          class="w-4 h-4 mr-1"
          :class="{ 'animate-spin': checking }"
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
        Refresh
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Producer Service Status -->
      <div
        class="flex items-center p-4 rounded-lg transition-all"
        :class="getStatusCardClass(producerStatus)"
      >
        <div class="flex-shrink-0 mr-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="getStatusBgClass(producerStatus)"
          >
            <svg
              v-if="producerStatus === 'online'"
              class="w-6 h-6 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-600">Producer Service</p>
          <p
            class="text-sm font-semibold"
            :class="getStatusTextClass(producerStatus)"
          >
            {{ producerStatus === "online" ? "● Online" : "● Offline" }}
          </p>
        </div>
      </div>

      <!-- Consumer Service Status -->
      <div
        class="flex items-center p-4 rounded-lg transition-all"
        :class="getStatusCardClass(consumerStatus)"
      >
        <div class="flex-shrink-0 mr-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="getStatusBgClass(consumerStatus)"
          >
            <svg
              v-if="consumerStatus === 'online'"
              class="w-6 h-6 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-600">Consumer Service</p>
          <p
            class="text-sm font-semibold"
            :class="getStatusTextClass(consumerStatus)"
          >
            {{ consumerStatus === "online" ? "● Online" : "● Offline" }}
          </p>
        </div>
      </div>

      <!-- Kafka Broker Status -->
      <div
        class="flex items-center p-4 rounded-lg transition-all"
        :class="getStatusCardClass(kafkaStatus)"
      >
        <div class="flex-shrink-0 mr-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="getStatusBgClass(kafkaStatus)"
          >
            <svg
              v-if="kafkaStatus === 'connected'"
              class="w-6 h-6 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-600">Kafka Broker</p>
          <p
            class="text-sm font-semibold"
            :class="getStatusTextClass(kafkaStatus)"
          >
            {{
              kafkaStatus === "connected" ? "● Connected" : "● Disconnected"
            }}
          </p>
        </div>
      </div>

      <!-- Consumer Instances Health -->
      <div
        class="flex items-center p-4 rounded-lg transition-all"
        :class="getConsumerHealthCardClass()"
      >
        <div class="flex-shrink-0 mr-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center"
            :class="getConsumerHealthBgClass()"
          >
            <svg
              v-if="consumerHealthStatus === 'healthy'"
              class="w-6 h-6 text-green-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
              />
            </svg>
            <svg
              v-else-if="consumerHealthStatus === 'warning'"
              class="w-6 h-6 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              v-else
              class="w-6 h-6 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-600">Consumer Health</p>
          <p
            class="text-sm font-semibold"
            :class="getConsumerHealthTextClass()"
          >
            {{ activeConsumers }}/{{ totalConsumers }} Active
          </p>
        </div>
      </div>
    </div>

    <!-- Warning/Error Messages -->
    <div v-if="showWarnings" class="mt-4 space-y-2">
      <!-- Consumer Warning -->
      <div
        v-if="consumerHealthStatus === 'warning'"
        class="bg-yellow-50 border-l-4 border-yellow-400 p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <strong>Warning:</strong> {{ activeConsumers }}/{{
                totalConsumers
              }}
              consumers are active. Some consumers may have stopped or crashed.
            </p>
          </div>
        </div>
      </div>

      <!-- Consumer Critical -->
      <div
        v-if="consumerHealthStatus === 'critical'"
        class="bg-red-50 border-l-4 border-red-400 p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">
              <strong>Critical:</strong> No active consumers! Please start at
              least one consumer to process messages.
            </p>
          </div>
        </div>
      </div>

      <!-- Service Offline -->
      <div
        v-if="producerStatus === 'offline'"
        class="bg-red-50 border-l-4 border-red-400 p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">
              <strong>Error:</strong> Producer Service is offline. Please check
              the service.
            </p>
          </div>
        </div>
      </div>

      <div
        v-if="consumerStatus === 'offline'"
        class="bg-red-50 border-l-4 border-red-400 p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">
              <strong>Error:</strong> Consumer Service is offline. Please check
              the service.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SystemStatus",
  props: {
    activeConsumers: {
      type: Number,
      default: 0,
    },
    totalConsumers: {
      type: Number,
      default: 0,
    },
    autoRefresh: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      producerStatus: "checking", // online, offline, checking
      consumerStatus: "checking", // online, offline, checking
      kafkaStatus: "checking", // connected, disconnected, checking
      checking: false,
      refreshInterval: null,
    };
  },
  computed: {
    consumerHealthStatus() {
      if (this.totalConsumers === 0) return "critical";
      if (this.activeConsumers === 0) return "critical";
      if (this.activeConsumers < this.totalConsumers) return "warning";
      return "healthy";
    },
    showWarnings() {
      return (
        this.consumerHealthStatus !== "healthy" ||
        this.producerStatus === "offline" ||
        this.consumerStatus === "offline"
      );
    },
  },
  mounted() {
    this.checkAllStatus();
    
    if (this.autoRefresh) {
      this.refreshInterval = setInterval(() => {
        this.checkAllStatus();
      }, 10000); // Check every 10 seconds
    }
  },
  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async checkAllStatus() {
      this.checking = true;
      await Promise.all([
        this.checkProducerService(),
        this.checkConsumerService(),
        this.checkKafkaStatus(),
      ]);
      this.checking = false;
    },
    async checkProducerService() {
      try {
        const response = await axios.get("http://localhost:3000/api", {
          timeout: 3000,
        });
        this.producerStatus = response.status === 200 ? "online" : "offline";
      } catch (error) {
        this.producerStatus = "offline";
      }
    },
    async checkConsumerService() {
      try {
        const response = await axios.get("http://localhost:3001/api/consumers/stats", {
          timeout: 3000,
        });
        this.consumerStatus = response.status === 200 ? "online" : "offline";
      } catch (error) {
        this.consumerStatus = "offline";
      }
    },
    async checkKafkaStatus() {
      try {
        // Check Kafka thông qua Producer Service
        const response = await axios.get("http://localhost:3000/api/admin/topics", {
          timeout: 3000,
        });
        this.kafkaStatus = response.data.status === "success" ? "connected" : "disconnected";
      } catch (error) {
        this.kafkaStatus = "disconnected";
      }
    },
    getStatusCardClass(status) {
      if (status === "online" || status === "connected") {
        return "bg-green-50 border border-green-200";
      } else if (status === "checking") {
        return "bg-gray-50 border border-gray-200";
      }
      return "bg-red-50 border border-red-200";
    },
    getStatusBgClass(status) {
      if (status === "online" || status === "connected") {
        return "bg-green-100";
      } else if (status === "checking") {
        return "bg-gray-100";
      }
      return "bg-red-100";
    },
    getStatusTextClass(status) {
      if (status === "online" || status === "connected") {
        return "text-green-600";
      } else if (status === "checking") {
        return "text-gray-600";
      }
      return "text-red-600";
    },
    getConsumerHealthCardClass() {
      if (this.consumerHealthStatus === "healthy") {
        return "bg-green-50 border border-green-200";
      } else if (this.consumerHealthStatus === "warning") {
        return "bg-yellow-50 border border-yellow-200";
      }
      return "bg-red-50 border border-red-200";
    },
    getConsumerHealthBgClass() {
      if (this.consumerHealthStatus === "healthy") {
        return "bg-green-100";
      } else if (this.consumerHealthStatus === "warning") {
        return "bg-yellow-100";
      }
      return "bg-red-100";
    },
    getConsumerHealthTextClass() {
      if (this.consumerHealthStatus === "healthy") {
        return "text-green-600";
      } else if (this.consumerHealthStatus === "warning") {
        return "text-yellow-600";
      }
      return "text-red-600";
    },
  },
};
</script>
