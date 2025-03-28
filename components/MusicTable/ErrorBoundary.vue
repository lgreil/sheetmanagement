<template>
    <div>
        <slot v-if="!error" />
        <div
            v-else
            class="rounded-lg bg-surface p-4 border border-border"
            role="alert"
        >
            <div class="flex">
                <UIcon
                    name="i-heroicons-exclamation-triangle"
                    class="h-5 w-5 text-primary"
                    aria-hidden="true"
                />
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-text">
                        An error occurred
                    </h3>
                    <div class="mt-2 text-sm text-muted-text">
                        <p>{{ error.message }}</p>
                        <p v-if="isDev" class="mt-1 font-mono text-xs">
                            {{ error.stack }}
                        </p>
                    </div>
                    <div class="mt-4">
                        <UButton size="sm" color="primary" @click="resetError">
                            Try Again
                        </UButton>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const error = ref<Error | null>(null);
const isDev = process.dev || false;

function resetError() {
    error.value = null;
}

// Handle errors in child components
onErrorCaptured((err: Error) => {
    error.value = err;
    return false; // Prevent error from propagating
});
</script>
