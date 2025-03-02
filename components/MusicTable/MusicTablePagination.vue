<template>
  <div class="flex items-center justify-between px-4 py-3 bg-blue-900/30 dark:bg-gray-800/50">
    <div class="text-sm text-white/70 dark:text-gray-300">
      Showing {{ startItem }}-{{ endItem }} of {{ totalItems }} pieces
    </div>
    
    <div class="flex items-center space-x-2">
      <UButton
        icon="i-heroicons-chevron-double-left"
        variant="ghost"
        color="white"
        class="pagination-button"
        :disabled="pageIndex === 0"
        @click="updatePageIndex(0)"
      />
      <UButton
        icon="i-heroicons-chevron-left"
        variant="ghost"
        color="white"
        class="pagination-button"
        :disabled="pageIndex === 0"
        @click="updatePageIndex(pageIndex - 1)"
      />
      
      <!-- Page numbers -->
      <div class="flex space-x-1">
        <UButton
          v-for="pageNum in visiblePageNumbers"
          :key="pageNum"
          variant="ghost"
          color="white"
          size="sm"
          :class="['pagination-button', pageNum === pageIndex + 1 ? 'active' : '']"
          @click="updatePageIndex(pageNum - 1)"
        >
          {{ pageNum }}
        </UButton>
      </div>
      
      <UButton
        icon="i-heroicons-chevron-right"
        variant="ghost"
        color="white"
        class="pagination-button"
        :disabled="pageIndex >= totalPages - 1"
        @click="updatePageIndex(pageIndex + 1)"
      />
      <UButton
        icon="i-heroicons-chevron-double-right"
        variant="ghost"
        color="white"
        class="pagination-button"
        :disabled="pageIndex >= totalPages - 1"
        @click="updatePageIndex(totalPages - 1)"
      />
      
      <!-- Page size selector -->
      <div class="page-size-container ml-4">
        <select
          :value="pageSize"
          @change="updatePageSize($event.target.value)"
          class="page-size-selector"
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  pageIndex: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  totalItems: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:pageIndex', 'update:pageSize']);

// Computed properties
const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize) || 1);

const startItem = computed(() => {
  if (props.totalItems === 0) return 0;
  return props.pageIndex * props.pageSize + 1;
});

const endItem = computed(() => {
  const end = (props.pageIndex + 1) * props.pageSize;
  return end > props.totalItems ? props.totalItems : end;
});

// Generate array of visible page numbers
const visiblePageNumbers = computed(() => {
  const maxVisiblePages = 5;
  const pageNumbers = [];
  
  let startPage = Math.max(1, props.pageIndex + 1 - Math.floor(maxVisiblePages / 2));
  const endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }
  
  return pageNumbers;
});

// Methods to update pageIndex and pageSize
const updatePageIndex = (newPageIndex) => {
  emit('update:pageIndex', newPageIndex);
};

const updatePageSize = (newPageSize) => {
  emit('update:pageSize', parseInt(newPageSize));
};
</script>

<style>
/* Pagination styling - improved buttons */
.pagination-button {
  background-color: rgba(30, 58, 138, 0.3);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  color: white;
  transition: color 0.2s;
}

.pagination-button:hover {
  background-color: rgba(30, 58, 138, 0.5);
}

.pagination-button.active {
  background-color: #2563eb;
}

/* Page size selector */
.page-size-selector {
  background-color: rgba(30, 58, 138, 0.3);
  border: 1px solid rgba(30, 58, 138, 0.3);
  border-radius: 0.375rem;
  color: white;
  padding: 0.25rem 0.5rem;
  appearance: none;
  position: relative;
  padding-right: 2rem;
}

.page-size-container {
  position: relative;
}

.page-size-container:after {
  content: "▼";
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  pointer-events: none;
}
</style>