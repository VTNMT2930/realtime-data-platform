<template>
  <div class="p-8 bg-white rounded-lg shadow max-w-4xl mx-auto">
    <form @submit.prevent="startSending">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Cột trái -->
        <div>
          <label for="topic" class="block text-sm font-medium text-gray-700">Topic</label>
          <input type="text" id="topic" v-model="form.topic"
            class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., user-activity-stream">
        </div>
        <!-- Cột phải -->
        <div>
          <label for="interval" class="block text-sm font-medium text-gray-700">Tần suất gửi (giây)</label>
          <input type="number" id="interval" v-model.number="form.interval"
            class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 5">
        </div>
        <div>
          <label for="limit" class="block text-sm font-medium text-gray-700">Số lượng gửi (để trống để gửi vô hạn)</label>
          <input type="number" id="limit" v-model.number="form.limit"
            class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 1000">
        </div>
        <div>
          <label for="duration" class="block text-sm font-medium text-gray-700">Thời gian chạy (phút, để trống để chạy vô hạn)</label>
          <input type="number" id="duration" v-model.number="form.duration"
            class="block w-full p-3 mt-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 60">
        </div>
      </div>

      <!-- Mẫu tin nhắn -->
      <div class="mt-6">
        <label for="messageTemplate" class="block text-sm font-medium text-gray-700">Mẫu tin nhắn</label>
        <textarea id="messageTemplate" v-model="form.messageTemplate" rows="10"
          class="block w-full p-3 mt-1 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="{ ... }"></textarea>
        <p class="mt-2 text-xs text-gray-500" v-pre>
          Sử dụng {{...}} cho các biến động. Ví dụ: {{uuid()}}, {{random(min,max)}}, {{timestamp()}}.
        </p>
      </div>

      <!-- Trạng thái và Nút bấm -->
      <div class="flex items-center justify-between mt-6">
        <div>
          <span class="text-sm font-medium text-gray-700">Trạng thái: </span>
          <span class="px-3 py-1 ml-2 text-sm font-medium rounded-full"
            :class="isRunning ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'">
            {{ isRunning ? 'Đang chạy' : 'Đã dừng' }}
          </span>
        </div>
        <div class="flex space-x-4">
          <button @click="stopSending" type="button"
            class="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            :disabled="!isRunning">
            <StopIcon class="w-5 h-5 mr-2" />
            Dừng
          </button>
          <button type="submit"
            class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            :disabled="isRunning">
            <PlayIcon class="w-5 h-5 mr-2" />
            Bắt đầu
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { PlayIcon, StopIcon } from '@heroicons/vue/24/solid';

const isRunning = ref(false);
const form = reactive({
  topic: 'user-activity-stream',
  interval: 5,
  limit: 1000,
  duration: 60,
  messageTemplate: `{
  "userId": "{{uuid()}}",
  "event": "page_view",
  "url": "/products/{{random(100, 999)}}",
  "timestamp": "{{timestamp()}}"
}`
});

const startSending = () => {
  console.log('Bắt đầu gửi:', form);
  isRunning.value = true;
  // Thêm logic interval ở đây
};

const stopSending = () => {
  console.log('Dừng gửi');
  isRunning.value = false;
  // Thêm logic clear interval ở đây
};
</script>