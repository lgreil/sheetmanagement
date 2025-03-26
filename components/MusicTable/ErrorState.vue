<template>
  <div class="flex flex-col items-center justify-center p-8 text-center">
    <UIcon
      :name="error.type === 'error' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-information-circle'"
      class="w-12 h-12 mb-4"
      :class="error.type === 'error' ? 'text-red-500' : 'text-blue-500'"
    />
    
    <h3 class="text-lg font-medium mb-2">
      {{ error.message }}
    </h3>
    
    <p v-if="error.code" class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      Error code: {{ error.code }}
    </p>

    <div class="space-x-4">
      <UButton
        v-if="error.retry"
        :loading="isRetrying"
        :disabled="isRetrying"
        @click="handleRetry"
        color="primary"
      >
        Try Again
      </UButton>

      <UButton
        v-if="onDismiss"
        variant="ghost"
        @click="onDismiss"
      >
        Dismiss
      </UButton>
    </div>

    <!-- Debug Information (Development Only) -->
    <div 
      v-if="process.dev && error.debug" 
      class="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left w-full max-w-2xl"
    >
      <p class="text-sm font-medium mb-2">Debug Information:</p>
      <pre class="text-xs overflow-x-auto">{{ error.debug }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableError } from '~/composables/useTableError'

interface Props {
  error: TableError
  onDismiss?: () => void
}

const props = defineProps<Props>()
const isRetrying = ref(false)

async function handleRetry() {
  if (!props.error.retry) return
  
  isRetrying.value = true
  try {
    await props.error.retry()
  } finally {
    isRetrying.value = false
  }
}
</script>