<template>
    <div class="flex justify-center">
        <div class="w-4 h-4 rounded-full"
            :class="isDigitized ? 'bg-emerald-500 dark:bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'"
            :title="isDigitized ? 'Digitized' : 'Not digitized'"></div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    isDigitized: boolean
}>()
</script>
