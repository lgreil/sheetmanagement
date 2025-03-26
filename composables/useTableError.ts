import { ref, computed } from 'vue'

export interface TableError {
  message: string
  type: 'error' | 'warning' | 'info'
  code?: string
  retry?: () => Promise<void>
}

export function useTableError() {
  const error = ref<TableError | null>(null)
  const isLoading = ref(false)

  const hasError = computed(() => error.value !== null)

  function setError(newError: TableError | null) {
    error.value = newError
  }

  function clearError() {
    error.value = null
  }

  async function withErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'An error occurred'
  ): Promise<T | undefined> {
    try {
      isLoading.value = true
      clearError()
      return await operation()
    } catch (e) {
      const err = e as Error
      setError({
        message: errorMessage,
        type: 'error',
        code: err.name,
        retry: () => withErrorHandling(operation, errorMessage)
      })
      return undefined
    } finally {
      isLoading.value = false
    }
  }

  return {
    error: readonly(error),
    isLoading: readonly(isLoading),
    hasError,
    setError,
    clearError,
    withErrorHandling
  }
}