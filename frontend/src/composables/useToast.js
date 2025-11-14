import { ref } from 'vue';

const toasts = ref([]);
let toastId = 0;

export const useToast = () => {
  const show = (message, type = 'info', duration = 3000) => {
    const id = toastId++;
    toasts.value.push({
      id,
      message,
      type,
      duration,
      show: true
    });

    if (duration > 0) {
      setTimeout(() => {
        remove(id);
      }, duration + 300);
    }

    return id;
  };

  const success = (message, duration = 3000) => {
    return show(message, 'success', duration);
  };

  const error = (message, duration = 4000) => {
    return show(message, 'error', duration);
  };

  const warning = (message, duration = 3500) => {
    return show(message, 'warning', duration);
  };

  const info = (message, duration = 3000) => {
    return show(message, 'info', duration);
  };

  const remove = (id) => {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index > -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clear = () => {
    toasts.value = [];
  };

  return {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    remove,
    clear
  };
};
