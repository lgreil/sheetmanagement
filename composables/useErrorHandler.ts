// composables/useErrorHandler.ts
import { ref } from "vue";

interface ErrorState {
  message: string;
  details?: any;
  type?: "error" | "warning" | "info";
  retryable?: boolean;
}

export function useErrorHandler() {
  const error = ref<ErrorState | null>(null);

  const handleError = (errorState: ErrorState) => {
    error.value = {
      ...errorState,
      type: errorState.type || "error",
      retryable: errorState.retryable ?? true,
    };

    // Optional: Log to error tracking service
    console.error("Error:", errorState);
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    error: computed(() => error.value),
    handleError,
    clearError,
  };
}
