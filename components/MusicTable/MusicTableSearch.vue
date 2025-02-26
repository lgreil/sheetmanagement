<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
    <div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
      Search across all columns (name, genre, composer, arranger, etc.)
    </div>
    <UInput 
      :model-value="modelValue" 
      @update:model-value="$emit('update:modelValue', String($event))"
      class="w-full" 
      placeholder="Search anything..." 
      icon="i-lucide-search" 
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
    modelValue: string
}>()

defineEmits<{
    'update:modelValue': [value: string]
}>()
</script>

