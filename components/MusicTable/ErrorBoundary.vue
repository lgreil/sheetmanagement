<template>
  <div>
    <slot v-if="!error" />
    <div v-else class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4" role="alert">
      <div class="flex">
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="h-5 w-5 text-red-400"
          aria-hidden="true"
        />
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            An error occurred
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            <p>{{ error.message }}</p>
            <p v-if="process.dev" class="mt-1 font-mono text-xs">
              {{ error.stack }}
            </p>
          </div>
          <div class="mt-4">
            <UButton
              size="sm"
              color="red"
              @click="resetError"
            >
              Try Again
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const error = ref<Error | null>(null)

function resetError() {
  error.value = null
}

// Handle errors in child components
onErrorCaptured((err: Error) => {
  error.value = err
  return false // Prevent error from propagating
})
</script>