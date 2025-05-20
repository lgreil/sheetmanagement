// composables/useErrorHandler.ts
import { ref } from 'vue';

interface ErrorState {
  message: string;
  details?: any;
  type?: "error" | "warning" | "info";
  retryable?: boolean;
}

export function useErrorHandler() {
  const error = ref<ErrorState | null>(null);
  const loading = ref(false);

  const handleError = (errorState: ErrorState) => {
    error.value = errorState;
  };

  const clearError = () => {
    error.value = null;
  };

  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    errorMessage: string
  ): Promise<T> => {
    loading.value = true;
    error.value = null;
    try {
      return await apiCall();
    } catch (e) {
      error.value = {
        message: errorMessage,
        type: 'error',
        details: e
      };
      console.error(`Error: ${errorMessage}`, e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const handleFileOperation = async <T>(
    fileOperation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> => {
    loading.value = true;
    error.value = null;
    try {
      return await fileOperation();
    } catch (e) {
      error.value = {
        message: errorMessage,
        type: 'error',
        details: e
      };
      console.error(`Error: ${errorMessage}`, e);
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return {
    error,
    loading,
    handleError,
    clearError,
    handleApiCall,
    handleFileOperation
  };
}
