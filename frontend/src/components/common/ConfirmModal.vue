<template>
  <Transition name="modal">
    <div
      v-if="show"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      @click.self="handleCancel"
    >
      <div
        class="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all"
        @click.stop
      >
        <!-- Header with Icon -->
        <div class="p-6 pb-4">
          <div class="flex items-start gap-4">
            <!-- Icon based on type -->
            <div
              :class="[
                'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
                iconBgClass
              ]"
            >
              <component :is="icon" :class="['w-6 h-6', iconColorClass]" />
            </div>

            <!-- Title and Message -->
            <div class="flex-1 pt-1">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ title }}
              </h3>
              <p class="text-sm text-gray-600 whitespace-pre-line">
                {{ message }}
              </p>
            </div>
          </div>
        </div>

        <!-- Consumer ID Badge (if provided) -->
        <div v-if="consumerId" class="px-6 pb-4">
          <div class="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
            <svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <span class="text-sm font-mono font-medium text-gray-800">
              {{ consumerId }}
            </span>
          </div>
        </div>

        <!-- Warning Message (for dangerous actions) -->
        <div v-if="type === 'danger'" class="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-red-800 font-medium">
              ⚠️ This action cannot be undone!
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="px-6 pb-6 flex gap-3 justify-end">
          <button
            @click="handleCancel"
            type="button"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleConfirm"
            type="button"
            :class="[
              'px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
              confirmButtonClass
            ]"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue';
import {
  PlayIcon,
  PauseIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'warning',
    validator: (value) => ['warning', 'danger', 'resume'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  consumerId: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  }
});

const emit = defineEmits(['confirm', 'cancel', 'close']);

// Icon configuration based on type
const icon = computed(() => {
  switch (props.type) {
    case 'resume':
      return PlayIcon;
    case 'danger':
      return TrashIcon;
    default:
      return PauseIcon;
  }
});

const iconBgClass = computed(() => {
  switch (props.type) {
    case 'resume':
      return 'bg-green-100';
    case 'danger':
      return 'bg-red-100';
    default:
      return 'bg-yellow-100';
  }
});

const iconColorClass = computed(() => {
  switch (props.type) {
    case 'resume':
      return 'text-green-600';
    case 'danger':
      return 'text-red-600';
    default:
      return 'text-yellow-600';
  }
});

const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'resume':
      return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    default:
      return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
  }
});

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};

const handleCancel = () => {
  emit('cancel');
  emit('close');
};
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .bg-white {
  transform: scale(0.95);
  opacity: 0;
}

.modal-leave-to .bg-white {
  transform: scale(0.95);
  opacity: 0;
}
</style>
