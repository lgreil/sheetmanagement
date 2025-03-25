<template>
  <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3" v-auto-animate>
    <div class="text-sm text-gray-700 dark:text-gray-300 mb-2 md:mb-0">
      Showing {{ startItem }} – {{ endItem }} of {{ totalItems }} pieces
    </div>
    <div class="flex flex-wrap items-center gap-2" v-auto-animate>
      <UPagination v-model:page="pageIndex" color="neutral" variant="subtle" :total="totalPages" />
      <div class="page-size-container ml-2">
        <USelect v-model="pageSize" :options="pageSizeOptions" class="page-size-selector w-36" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useState } from "#app";

const pageIndex = useState("pageIndex", () => 0);
const pageSize = useState("pageSize", () => 10);
const totalItems = useState("totalItems", () => 0);

const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));
const startItem = computed(() => (totalItems.value === 0 ? 0 : pageIndex.value * pageSize.value + 1));
const endItem = computed(() => {
  const end = (pageIndex.value + 1) * pageSize.value;
  return end > totalItems.value ? totalItems.value : end;
});

const pageSizeOptions = [
  { label: "10 per page", value: 10 },
  { label: "20 per page", value: 20 },
  { label: "50 per page", value: 50 },
];
</script>

<style scoped>
.page-size-selector {
  min-width: 120px;
}
</style>
