<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between p-6 border-b border-gray-200"
      >
        <h3 class="text-xl font-semibold text-gray-900">
          Cập nhật cấu hình Topic
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Body -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Topic Name (Read-only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tên Topic <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            :value="topicName"
            disabled
            class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        <!-- Number of Partitions -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Số lượng Partitions
          </label>
          <input
            type="number"
            v-model.number="formData.numPartitions"
            :placeholder="`Hiện tại: ${currentPartitions || 'N/A'}`"
            min="1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-sm text-gray-500">
            <strong>Lưu ý:</strong> Chỉ có thể tăng số partition, không thể
            giảm. Để trống nếu không muốn thay đổi.
          </p>
        </div>

        <!-- Retention Time (ms) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Thời gian lưu trữ (Retention Time)
          </label>
          <div class="flex space-x-2">
            <input
              type="number"
              v-model.number="retentionValue"
              placeholder="7"
              min="1"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              v-model="retentionUnit"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hours">Giờ</option>
              <option value="days">Ngày</option>
              <option value="weeks">Tuần</option>
            </select>
          </div>
          <p class="mt-1 text-sm text-gray-500">
            Thời gian lưu trữ message trước khi tự động xóa. Để trống nếu không
            muốn thay đổi.
          </p>
        </div>

        <!-- Compression Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Loại nén (Compression Type)
          </label>
          <select
            v-model="formData.compressionType"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Không thay đổi --</option>
            <option value="uncompressed">Không nén</option>
            <option value="gzip">GZIP</option>
            <option value="snappy">Snappy</option>
            <option value="lz4">LZ4</option>
            <option value="zstd">ZSTD</option>
          </select>
          <p class="mt-1 text-sm text-gray-500">
            Kiểu nén message để tiết kiệm dung lượng.
          </p>
        </div>

        <!-- Max Message Size -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Kích thước message tối đa (bytes)
          </label>
          <input
            type="number"
            v-model.number="formData.maxMessageBytes"
            placeholder="1048576"
            min="1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-sm text-gray-500">
            Kích thước tối đa của một message (mặc định: 1MB = 1048576 bytes).
            Để trống nếu không muốn thay đổi.
          </p>
        </div>

        <!-- Min In-Sync Replicas -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Số Replicas đồng bộ tối thiểu (Min ISR)
          </label>
          <input
            type="number"
            v-model.number="formData.minInsyncReplicas"
            placeholder="1"
            min="1"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p class="mt-1 text-sm text-gray-500">
            Số lượng replicas tối thiểu phải đồng bộ trước khi ghi thành công.
            Để trống nếu không muốn thay đổi.
          </p>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? "Đang cập nhật..." : "Cập nhật" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { useToast } from "@/composables/useToast";

const props = defineProps({
  topicName: {
    type: String,
    required: true,
  },
  currentPartitions: {
    type: Number,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "save"]);

// Toast
const { warning } = useToast();

// Form data
const formData = ref({
  numPartitions: null,
  compressionType: "",
  maxMessageBytes: null,
  minInsyncReplicas: null,
});

// Retention time helpers
const retentionValue = ref(null);
const retentionUnit = ref("days");

// Computed retention in milliseconds
const retentionMs = computed(() => {
  if (!retentionValue.value) return null;

  const multipliers = {
    hours: 3600000,
    days: 86400000,
    weeks: 604800000,
  };

  return retentionValue.value * multipliers[retentionUnit.value];
});

const handleSubmit = () => {
  // Build update payload
  const payload = {};

  // Add numPartitions if changed
  if (formData.value.numPartitions && formData.value.numPartitions > 0) {
    // Validate không giảm partitions
    if (
      props.currentPartitions &&
      formData.value.numPartitions < props.currentPartitions
    ) {
      warning(
        `Không thể giảm số partition! Số partition hiện tại: ${props.currentPartitions}`
      );
      return;
    }
    payload.numPartitions = formData.value.numPartitions;
  }

  // Build configs object
  const configs = {};

  if (retentionMs.value) {
    configs["retention.ms"] = retentionMs.value.toString();
  }

  if (formData.value.compressionType) {
    configs["compression.type"] = formData.value.compressionType;
  }

  if (formData.value.maxMessageBytes) {
    configs["max.message.bytes"] = formData.value.maxMessageBytes.toString();
  }

  if (formData.value.minInsyncReplicas) {
    configs["min.insync.replicas"] =
      formData.value.minInsyncReplicas.toString();
  }

  if (Object.keys(configs).length > 0) {
    payload.configs = configs;
  }

  // Validate có ít nhất 1 thay đổi
  if (
    !payload.numPartitions &&
    Object.keys(payload.configs || {}).length === 0
  ) {
    warning("Vui lòng thay đổi ít nhất một cấu hình!");
    return;
  }

  emit("save", payload);
};
</script>
