<template>
  <div class="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
    <div class="text-sm text-gray-600 dark:text-gray-400">
      Showing page {{ pageIndex + 1 }} of {{ Math.ceil(totalItems / pageSize) }}
    </div>
    <UPagination :model-value="pageIndex + 1" :default-page="pageIndex + 1" :items-per-page="pageSize"
      :total="totalItems" @update:page="(p: number) => $emit('update:pageIndex', p - 1)" class="shadow-none" />
    <USelect :model-value="pageSize" @update:pageSize="(val: number) => $emit('update:pageSize', Number(val))"
      :options="pageSizeOptions" placeholder="Items per page" size="sm" class="w-32" />
  </div>
</template>

<script setup lang="ts">
import { UPagination, USelect } from '#components'

const props = defineProps<{
  pageIndex: number
  pageSize: number
  totalItems: number
}>()

defineEmits<{
  'update:pageIndex': [value: number]
  'update:pageSize': [value: number]
}>()

const pageSizeOptions = [5, 10, 20, 50]
</script>