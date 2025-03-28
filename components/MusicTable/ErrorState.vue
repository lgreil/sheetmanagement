<template>
    <div class="error-state">
        <UIcon :name="errorIcon" class="error-icon" />

        <h3 class="error-message">{{ error.message }}</h3>

        <p v-if="error.code" class="error-code">Error code: {{ error.code }}</p>

        <div class="error-actions">
            <UButton
                v-if="error.retry"
                :loading="isRetrying"
                :disabled="isRetrying"
                @click="handleRetry"
                color="primary"
            >
                Try Again
            </UButton>

            <UButton v-if="onDismiss" variant="ghost" @click="onDismiss">
                Dismiss
            </UButton>
        </div>

        <div
            v-if="import.meta.dev && error.debug !== undefined"
            class="error-debug"
        >
            <p class="debug-title">Debug Information:</p>
            <pre class="debug-content">{{
                error.debug !== undefined
                    ? error.debug
                    : "No debug information available"
            }}</pre>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { TableError } from "~/composables/useTableError";

interface Props {
    error: TableError;
    onDismiss?: () => void;
}

const props = defineProps<Props>();
const isRetrying = ref(false);

const errorIcon = computed(() =>
    props.error.type === "error"
        ? "i-heroicons-exclamation-triangle"
        : "i-heroicons-information-circle",
);

async function handleRetry() {
    if (!props.error.retry) return;

    isRetrying.value = true;
    try {
        await props.error.retry();
    } finally {
        isRetrying.value = false;
    }
}
</script>

<style scoped>
/* Main container */
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    color: var(--color-text);
}

/* Error icon styling */
.error-icon {
    width: 3rem;
    height: 3rem;
    margin-bottom: 1rem;
}

/* Styling for error messages */
.error-message {
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--color-text);
}

/* Style for error codes (if available) */
.error-code {
    font-size: 0.875rem;
    color: var(--color-muted-text);
    margin-bottom: 1rem;
}

/* Container for action buttons */
.error-actions {
    display: flex;
    gap: 1rem;
}

/* Debug information container (development only) */
.error-debug {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    text-align: left;
    width: 100%;
    max-width: 42rem;
}

/* Title for debug information */
.debug-title {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--color-text);
}

/* Content for debug information */
.debug-content {
    font-size: 0.75rem;
    overflow-x: auto;
    color: var(--color-text);
}

/* Style variations for different error types (optional) */
.error-icon[name="i-heroicons-exclamation-triangle"] {
    color: #ef4444;
}

.error-icon[name="i-heroicons-information-circle"] {
    color: var(--color-primary);
}
</style>
