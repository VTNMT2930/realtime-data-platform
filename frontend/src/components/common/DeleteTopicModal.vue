<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200"
      >
        <div class="flex items-center space-x-3">
          <div
            class="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full"
          >
            <ExclamationTriangleIcon class="w-6 h-6 text-red-600" />
          </div>
          <h3 class="text-xl font-semibold text-gray-900">
            Xác nhận xóa Topic
          </h3>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6">
        <p class="text-gray-700 mb-4">
          Bạn có chắc chắn muốn xóa topic
          <strong class="text-red-600">{{ topicName }}</strong> không?
        </p>
        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-5 w-5 text-yellow-400" />
            </div>
            <div class="ml-3">
              <p class="text-sm text-yellow-700">
                <strong>Cảnh báo:</strong> Hành động này không thể hoàn tác!
              </p>
              <p class="text-sm text-yellow-700 mt-1">
                Tất cả messages trong topic sẽ bị xóa vĩnh viễn.
              </p>
              <p class="text-sm text-yellow-700 mt-1">
                <strong>Lưu ý:</strong> Nếu có consumers đang hoạt động, topic
                sẽ được đánh dấu xóa và xóa hoàn toàn khi consumers ngắt kết
                nối.
              </p>
            </div>
          </div>
        </div>

        <!-- Confirmation input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nhập tên topic để xác nhận xóa:
          </label>
          <input
            type="text"
            v-model="confirmInput"
            :placeholder="topicName"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex justify-end space-x-3 px-6 pb-6">
        <button
          type="button"
          @click="$emit('close')"
          :disabled="loading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="!isConfirmed || loading"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "Đang xóa..." : "Xóa Topic" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  topicName: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "confirm"]);

const confirmInput = ref("");

const isConfirmed = computed(() => {
  return confirmInput.value.trim() === props.topicName.trim();
});

const handleConfirm = () => {
  if (isConfirmed.value) {
    emit("confirm");
  }
};
</script>
