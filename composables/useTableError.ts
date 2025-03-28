import { ref } from 'vue'

export interface TableError {
  message: string
  type: 'error' | 'warning' | 'info'
  code?: string
  retry?: () => Promise<void>
}

export function useTableError() {
  const error = ref<TableError | null>(null)

  const setError = (newError: TableError) => {
    error.value = newError
  }

  const clearError = () => {
    error.value = null
  }

  const withErrorHandling = async (
    fn: () => Promise<void>,
    errorMessage: string
  ) => {
    try {
      await fn()
    } catch (err: any) {
      setError({
        message: errorMessage,
        type: 'error',
        code: 'GENERIC_ERROR',
        retry: () => Promise.resolve()
      })
    }
  }

  return {
    error,
    setError,
    clearError,
    withErrorHandling
  }
}
