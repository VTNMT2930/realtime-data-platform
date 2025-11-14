<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click.self="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg">
      <div class="p-6">
        <h3 class="text-xl font-semibold text-gray-900">Create New Topic</h3>
      </div>
      <form @submit.prevent="submitForm">
        <div class="p-6 border-t border-b border-gray-200 space-y-6">
          <!-- Error Message -->
          <div v-if="errorMessage" class="p-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-lg">
            <div class="font-semibold mb-1">⚠️ Lỗi:</div>
            <div class="whitespace-pre-line">{{ errorMessage }}</div>
          </div>
          
          <div>
            <label for="topicName" class="block text-sm font-medium text-gray-700">Tên Topic</label>
            <input v-model="form.topicName" type="text" id="topicName" required
              placeholder="Ví dụ: user-events, order-transactions, logs..."
              class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <p class="mt-1 text-xs text-gray-500">Có thể sử dụng chữ cái, số, dấu gạch ngang (-) và gạch dưới (_)</p>
          </div>
          <div>
            <label for="partitions" class="block text-sm font-medium text-gray-700">Số Partitions</label>
            <input v-model.number="form.partitions" type="number" id="partitions" required min="1"
              placeholder="1"
              class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <p class="mt-1 text-xs text-gray-500">Số lượng partition giúp tăng hiệu suất xử lý song song</p>
          </div>
          <div>
            <label for="replicationFactor" class="block text-sm font-medium text-gray-700">Số Replication Factor</label>
            <input v-model.number="form.replicationFactor" type="number" id="replicationFactor" required min="1"
              placeholder="1"
              class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <p class="mt-1 text-xs text-gray-500">Số bản sao của dữ liệu để đảm bảo tính sẵn sàng</p>
          </div>
        </div>
        <div class="flex justify-end p-6 space-x-4 bg-gray-50 rounded-b-lg">
          <button @click="$emit('close')" type="button" :disabled="isSubmitting"
            class="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" :disabled="isSubmitting"
            class="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ isSubmitting ? 'Đang tạo...' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useKafkaStore } from '@/stores/kafkaStore';

const emit = defineEmits(['close', 'save']);
const kafkaStore = useKafkaStore();

const form = reactive({
  topicName: '',
  partitions: 1,
  replicationFactor: 1
});

const isSubmitting = ref(false);
const errorMessage = ref('');

const submitForm = async () => {
  isSubmitting.value = true;
  errorMessage.value = '';
  
  try {
    const result = await kafkaStore.createTopic({ ...form });
    
    // Kiểm tra kết quả
    if (result && result.status === 'success') {
      console.log('Topic created successfully:', result);
      emit('save', { ...form });
      emit('close');
    } else if (result && result.status === 'warn') {
      errorMessage.value = result.message || 'Topic đã tồn tại';
    } else {
      errorMessage.value = result?.message || 'Có lỗi xảy ra khi tạo topic';
    }
  } catch (error) {
    console.error('Error creating topic:', error);
    
    // Xử lý các loại lỗi khác nhau
    if (error.message.includes('Failed to fetch')) {
      errorMessage.value = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n' +
                          '1. Backend đã chạy chưa (port 3000)\n' +
                          '2. Kafka đã chạy chưa';
    } else if (error.message.includes('CORS')) {
      errorMessage.value = 'Lỗi CORS. Vui lòng khởi động lại backend';
    } else {
      errorMessage.value = error.message || 'Có lỗi xảy ra khi tạo topic';
    }
  } finally {
    isSubmitting.value = false;
  }
};
</script>