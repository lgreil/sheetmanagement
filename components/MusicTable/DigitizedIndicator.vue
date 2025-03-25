<template>
    <div class="flex justify-center">
        <div class="w-4 h-4 rounded-full"
            :class="isDigitized ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'"
            :title="isDigitized ? 'Digitized' : 'Not digitized'"></div>
    </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

defineProps({
    isDigitized: {
        type: Boolean,
        required: true
    }
});
</script>

<style>
/* Digitized indicator */
.digitized-indicator {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
}

.digitized-indicator.yes {
  background-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.digitized-indicator.no {
  background-color: #9ca3af;
}
</style>
