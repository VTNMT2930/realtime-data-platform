<template>
  <Transition name="toast">
    <div
      v-if="visible"
      :class="[
        'fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-md',
        'animate-slide-in',
        typeClasses
      ]"
    >
      <div class="flex-shrink-0">
        <component :is="icon" class="w-5 h-5" />
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium">{{ message }}</p>
      </div>
      <button
        @click="close"
        class="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  },
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const visible = ref(false);
let timeoutId = null;

const typeClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-50 text-green-800 border border-green-200';
    case 'error':
      return 'bg-red-50 text-red-800 border border-red-200';
    case 'warning':
      return 'bg-yellow-50 text-yellow-800 border border-yellow-200';
    default:
      return 'bg-blue-50 text-blue-800 border border-blue-200';
  }
});

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircleIcon;
    case 'error':
      return XCircleIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    default:
      return InformationCircleIcon;
  }
});

const close = () => {
  visible.value = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  setTimeout(() => {
    emit('close');
  }, 300);
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    visible.value = true;
    if (props.duration > 0) {
      timeoutId = setTimeout(() => {
        close();
      }, props.duration);
    }
  } else {
    visible.value = false;
  }
});

onMounted(() => {
  if (props.show) {
    visible.value = true;
    if (props.duration > 0) {
      timeoutId = setTimeout(() => {
        close();
      }, props.duration);
    }
  }
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
