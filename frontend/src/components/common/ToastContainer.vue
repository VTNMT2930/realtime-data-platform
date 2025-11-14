<template>
  <div class="fixed top-4 right-4 z-50 space-y-2">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      :show="toast.show"
      @close="remove(toast.id)"
    />
  </div>
</template>

<script setup>
import Toast from './Toast.vue';
import { useToast } from '@/composables/useToast';

const { toasts, remove } = useToast();
</script>
