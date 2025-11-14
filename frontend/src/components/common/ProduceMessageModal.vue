<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    @click.self="$emit('close')"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl">
      <!-- Header Modal -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200"
      >
        <h3 class="text-xl font-semibold text-gray-900">Produce Message</h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Tabs (Gửi đơn lẻ / Import CSV) -->
      <div class="flex border-b border-gray-200 px-6">
        <button
          @click="activeTab = 'single'"
          class="flex items-center px-4 py-3 -mb-px text-sm font-medium border-b-2"
          :class="
            activeTab === 'single'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
        >
          <PaperAirplaneIcon class="w-5 h-5 mr-2" />
          Gửi Transaction đơn lẻ
        </button>
        <button
          @click="activeTab = 'csv'"
          class="flex items-center px-4 py-3 -mb-px text-sm font-medium border-b-2"
          :class="
            activeTab === 'csv'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          "
        >
          <ArrowUpTrayIcon class="w-5 h-5 mr-2" />
          Import CSV
        </button>
      </div>

      <!-- Nội dung Tab 1: Gửi đơn lẻ -->
      <div v-if="activeTab === 'single'" class="p-6">
        <p class="text-sm text-gray-600 mb-4">
          Điền thông tin vào form dưới đây để gửi một transaction mới đến Kafka.
        </p>

        <!-- Error/Success Message -->
        <div
          v-if="message"
          class="mb-4 p-3 rounded-lg"
          :class="
            messageType === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          "
        >
          {{ message }}
        </div>

        <form @submit.prevent="sendSingleMessage">
          <div>
            <label for="message" class="block text-sm font-medium text-gray-700"
              >Message</label
            >
            <textarea
              id="message"
              v-model="singleMessage"
              rows="8"
              required
              class="block w-full p-3 mt-1 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder='{ "transaction_id": "12345", "amount": 1000, "currency": "USD" }'
            ></textarea>
            <p class="mt-2 text-xs text-gray-500">
              Nhập message ở định dạng JSON.
            </p>
          </div>
          <div class="flex justify-end space-x-4 mt-6">
            <button
              @click="$emit('close')"
              type="button"
              :disabled="isSubmitting"
              class="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {{ isSubmitting ? "Đang gửi..." : "Gửi" }}
            </button>
          </div>
        </form>
      </div>

      <!-- Nội dung Tab 2: Import CSV -->
      <div v-if="activeTab === 'csv'" class="p-6">
        <!-- Error/Success Message -->
        <div
          v-if="message"
          class="mb-4 p-3 rounded-lg"
          :class="
            messageType === 'error'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          "
        >
          {{ message }}
        </div>

        <div
          class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg"
        >
          <ArrowUpTrayIcon class="w-12 h-12 text-gray-400" />
          <h4 class="mt-4 text-lg font-semibold text-gray-700">
            Upload file CSV (2k+ records)
          </h4>
          <p class="mt-1 text-sm text-gray-500">
            Chọn file CSV hoặc kéo thả file vào đây
          </p>
          <p class="mt-2 text-xs text-gray-500">
            Format: orderNumber, productName, quantity, price
          </p>
          <input
            ref="fileInput"
            type="file"
            class="hidden"
            @change="handleFileUpload"
            accept=".csv"
          />
          <button
            @click="triggerFileInput"
            type="button"
            :disabled="isUploading"
            class="mt-6 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isUploading ? "Đang upload..." : "Bắt đầu Import" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowUpTrayIcon,
} from "@heroicons/vue/24/outline";
import {
  sendSingleMessage as sendSingleMessageApi,
  uploadCsvFile,
} from "@/services/apiService";

const emit = defineEmits(["close", "success"]);
const route = useRoute();
const activeTab = ref("single"); // 'single' hoặc 'csv'
const fileInput = ref(null);
const singleMessage = ref("");

const isSubmitting = ref(false);
const isUploading = ref(false);
const message = ref("");
const messageType = ref(""); // 'error' hoặc 'success'

// Get topic from route params
const topicName = computed(() => route.params.topicName);

const sendSingleMessage = async () => {
  isSubmitting.value = true;
  message.value = "";

  try {
    // Parse JSON từ textarea
    let messageData;
    try {
      messageData = JSON.parse(singleMessage.value);
    } catch (parseError) {
      message.value = "JSON không hợp lệ. Vui lòng kiểm tra lại format.";
      messageType.value = "error";
      isSubmitting.value = false;
      return;
    }

    const result = await sendSingleMessageApi(topicName.value, messageData);
    message.value = result.message || "Message đã được gửi thành công!";
    messageType.value = "success";

    // Reset form
    singleMessage.value = "";

    emit("success");

    // Auto close after 2 seconds
    setTimeout(() => {
      emit("close");
    }, 2000);
  } catch (error) {
    message.value = error.message || "Có lỗi xảy ra khi gửi message";
    messageType.value = "error";
    console.error("Error sending message:", error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isUploading.value = true;
  message.value = "";

  try {
    const result = await uploadCsvFile(topicName.value, file);
    message.value = `Upload thành công! Job ID: ${result.jobId}`;
    messageType.value = "success";

    emit("success");

    // Auto close after 2 seconds
    setTimeout(() => {
      emit("close");
    }, 2000);
  } catch (error) {
    message.value = error.message || "Có lỗi xảy ra khi upload file";
    messageType.value = "error";
    console.error("Error uploading file:", error);
  } finally {
    isUploading.value = false;
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
};

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};
</script>
