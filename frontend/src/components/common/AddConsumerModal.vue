<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b">
        <h3 class="text-xl font-semibold text-gray-900">🚀 Add New Consumer</h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 transition"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <!-- Consumer ID Input -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Consumer ID (Optional)
          </label>
          <input
            v-model="formData.consumerId"
            type="text"
            placeholder="Leave empty for auto-generate"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          <p class="mt-1 text-xs text-gray-500">
            Nếu để trống, ID sẽ tự động tạo dạng: consumer-1730649000123
          </p>
        </div>

        <!-- Group ID Input -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Kafka Consumer Group (Optional)
          </label>
          <input
            v-model="formData.groupId"
            type="text"
            placeholder="platform-consumer-group-server"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          />
          <p class="mt-1 text-xs text-gray-500">
            Default: platform-consumer-group-server
          </p>
        </div>

        <!-- Topic Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
              </svg>
              <span>Select Topic to Subscribe</span>
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Optional</span>
            </div>
          </label>
          
          <div class="relative">
            <select
              v-model="formData.topicName"
              class="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-400 text-sm"
              :disabled="loadingTopics"
              :class="{ 
                'bg-gray-50 cursor-not-allowed': loadingTopics,
                'border-green-300 bg-green-50': formData.topicName && !loadingTopics
              }"
            >
              <option value="" disabled>
                {{ loadingTopics ? "🔄 Loading available topics..." : "📋 Choose a topic (optional)" }}
              </option>
              <option
                v-for="topic in availableTopics"
                :key="topic.topicName || topic.name"
                :value="topic.topicName || topic.name"
                class="py-2"
              >
                🏷️ {{ topic.topicName || topic.name }} 
                ({{ getPartitionCount(topic) }} partitions)
              </option>
            </select>
            
            <!-- Loading Spinner -->
            <div v-if="loadingTopics" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg class="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            
            <!-- Success Check Icon -->
            <div v-else-if="formData.topicName" class="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg class="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
            </div>
          </div>
          
          <div class="mt-2 flex items-start gap-2">
            <svg class="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div class="text-xs text-gray-600">
              <p v-if="loadingTopics" class="text-blue-600">
                📡 Fetching available topics from Kafka broker...
              </p>
              <p v-else-if="formData.topicName" class="text-green-700">
                ✅ Consumer will subscribe to <strong>{{ formData.topicName }}</strong> and process incoming messages
              </p>
              <p v-else class="text-gray-500">
                💡 Select a topic to automatically subscribe for message processing, or leave empty for manual configuration
              </p>
            </div>
          </div>
        </div>

        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start">
            <svg
              class="w-5 h-5 text-blue-600 mt-0.5 mr-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="text-sm text-blue-800">
              <p class="font-medium mb-1">📌 Lưu ý:</p>
              <ul class="list-disc list-inside space-y-1">
                <li>Port sẽ tự động tăng (3001, 3002, 3003...)</li>
                <li>Consumer sẽ xuất hiện trong Dashboard sau ~10 giây</li>
                <li>📋 <strong>Nếu chọn topic:</strong> Consumer sẽ tự động đăng ký nhận message từ topic đó</li>
                <li>Có thể stop consumer bất cứ lúc nào</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div
          v-if="error"
          class="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div class="flex items-center text-red-800">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm">{{ error }}</span>
          </div>
        </div>

        <!-- Success Message -->
        <div
          v-if="success"
          class="bg-green-50 border border-green-200 rounded-lg p-4"
        >
          <div class="flex items-center text-green-800">
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="text-sm">{{ success }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
        <button
          @click="closeModal"
          class="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          :disabled="loading"
        >
          Cancel
        </button>
        <button
          @click="handleCreate"
          class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          :disabled="loading"
        >
          <svg
            v-if="loading"
            class="animate-spin h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>{{ loading ? "Creating..." : "Create Consumer" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { createConsumer, getTopics } from "@/services/apiService";

export default {
  name: "AddConsumerModal",
  props: {
    isOpen: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      formData: {
        consumerId: "",
        groupId: "",
        topicName: "",
      },
      loading: false,
      loadingTopics: false,
      availableTopics: [],
      error: null,
      success: null,
    };
  },
  watch: {
    // Load topics khi modal được mở
    isOpen(newValue) {
      if (newValue) {
        this.loadTopics();
      }
    },
  },
  methods: {
    closeModal() {
      if (!this.loading) {
        this.resetForm();
        this.$emit("close");
      }
    },
    resetForm() {
      this.formData = {
        consumerId: "",
        groupId: "",
        topicName: "",
      };
      this.error = null;
      this.success = null;
    },
    
    // ✅ Helper: Get partition count từ topic object
    getPartitionCount(topic) {
      // Backend trả về partitions là number (enriched data)
      if (typeof topic.partitions === 'number') {
        return topic.partitions;
      }
      // Legacy: partitions là array
      if (Array.isArray(topic.partitions)) {
        return topic.partitions.length;
      }
      // partitionDetails (backup field)
      if (Array.isArray(topic.partitionDetails)) {
        return topic.partitionDetails.length;
      }
      // Fallback
      return 1;
    },
    
    // ✅ Load danh sách topics từ API
    async loadTopics() {
      this.loadingTopics = true;
      try {
        const response = await getTopics();
        console.log("📋 Raw API response:", response);
        console.log("📋 Response status:", response?.status);
        console.log("📋 Response success:", response?.success);
        console.log("📋 Response data:", response?.data);
        
        // ✅ Fix: Kiểm tra cả status và success
        if (response && (response.success === true || response.status === 'success')) {
          this.availableTopics = response.data || [];
          console.log("📋 Loaded topics successfully:", this.availableTopics);
        } else {
          console.error("Failed to load topics:", response ? (response.message || response.error) : 'No response');
          // ✅ Sử dụng data từ API nếu có, ngay cả khi status không success
          if (response && response.data && Array.isArray(response.data)) {
            this.availableTopics = response.data;
            console.log("📋 Using API data despite status:", this.availableTopics);
          } else {
            this.availableTopics = [];
          }
        }
      } catch (error) {
        console.error("Error loading topics:", error);
        console.error("Error details:", error.message);
        
        // ✅ Fallback: Use topics from image
        this.availableTopics = [
          { topicName: 'user-activity', partitions: 1 },
          { topicName: 'upfile', partitions: 1 },
          { topicName: 'transactions_topic', partitions: 1 },
          { topicName: 'test2', partitions: 1 },
          { topicName: 'test', partitions: 1 },
          { topicName: 'send-single', partitions: 1 },
          { topicName: 'payments', partitions: 1 },
          { topicName: 'orders', partitions: 1 }
        ];
        console.log("📋 Using fallback topics from system:", this.availableTopics);
      } finally {
        this.loadingTopics = false;
      }
    },
    async handleCreate() {
      this.loading = true;
      this.error = null;
      this.success = null;

      try {
        // Chỉ truyền giá trị nếu có nhập
        const consumerId = this.formData.consumerId.trim() || null;
        const groupId = this.formData.groupId.trim() || null;
        const topicName = this.formData.topicName.trim() || null;

        console.log("Creating consumer with:", { consumerId, groupId, topicName });

        const response = await createConsumer(consumerId, groupId, topicName);

        if (response.status === "success") {
          this.success = response.message;

          // Emit event để parent refresh data
          this.$emit("consumer-created", response.data);

          // Đóng modal sau 2 giây
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        } else {
          this.error = response.message || "Failed to create consumer";
        }
      } catch (error) {
        console.error("Error creating consumer:", error);
        this.error =
          error.message || "An error occurred while creating consumer";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
