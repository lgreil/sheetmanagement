<template>
  <nav class="flex flex-col md:flex-row items-center justify-between px-4 py-3 gap-4" aria-label="Table navigation">
    <div class="text-sm text-gray-700 dark:text-gray-300">
      <span class="font-medium">{{ startItem }}</span>
      –
      <span class="font-medium">{{ endItem }}</span>
      of
      <span class="font-medium">{{ totalItems }}</span>
      pieces
    </div>

    <div class="flex items-center gap-4">
      <UButtonGroup>
        <UButton
          icon="i-heroicons-chevron-double-left"
          :disabled="currentPage === 1"
          color="gray"
          variant="ghost"
          @click="goToFirstPage"
          aria-label="Go to first page"
        />
        <UButton
          icon="i-heroicons-chevron-left"
          :disabled="currentPage === 1"
          color="gray"
          variant="ghost"
          @click="goToPrevPage"
          aria-label="Go to previous page"
        />
        <UInput
          v-model="pageInput"
          type="number"
          :min="1"
          :max="totalPages"
          class="w-16 text-center"
          @keyup.enter="goToPage(Number(pageInput))"
          @blur="validatePageInput"
        />
        <UButton
          icon="i-heroicons-chevron-right"
          :disabled="currentPage === totalPages"
          color="gray"
          variant="ghost"
          @click="goToNextPage"
          aria-label="Go to next page"
        />
        <UButton
          icon="i-heroicons-chevron-double-right"
          :disabled="currentPage === totalPages"
          color="gray"
          variant="ghost"
          @click="goToLastPage"
          aria-label="Go to last page"
        />
      </UButtonGroup>

      <USelect
        v-model="selectedPageSize"
        :options="pageSizeOptions"
        :ui="{ 
          select: 'w-36',
          base: 'bg-white/10 border-blue-900/30'
        }"
        aria-label="Items per page"
        @update:modelValue="onPageSizeChange"
      />
    </div>
  </nav>
</template>

<script setup lang="ts">
interface Props {
  totalItems: number
  pageSize?: number
  pageIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 10,
  pageIndex: 0
})

const emit = defineEmits<{
  'update:pageSize': [value: number]
  'update:pageIndex': [value: number]
}>()

// Local state
const currentPage = ref(props.pageIndex + 1)
const selectedPageSize = ref(props.pageSize)
const pageInput = ref(String(currentPage.value))

// Computed values
const totalPages = computed(() => Math.max(1, Math.ceil(props.totalItems / selectedPageSize.value)))
const startItem = computed(() => props.totalItems === 0 ? 0 : (currentPage.value - 1) * selectedPageSize.value + 1)
const endItem = computed(() => {
  const end = currentPage.value * selectedPageSize.value
  return end > props.totalItems ? props.totalItems : end
})

const pageSizeOptions = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
  { label: '100 per page', value: 100 }
]

// Navigation methods
function goToPage(page: number) {
  const validPage = Math.max(1, Math.min(page, totalPages.value))
  currentPage.value = validPage
  pageInput.value = String(validPage)
  emit('update:pageIndex', validPage - 1)
}

function goToFirstPage() {
  goToPage(1)
}

function goToLastPage() {
  goToPage(totalPages.value)
}

function goToNextPage() {
  goToPage(currentPage.value + 1)
}

function goToPrevPage() {
  goToPage(currentPage.value - 1)
}

function validatePageInput() {
  const page = Number(pageInput.value)
  if (isNaN(page) || page < 1 || page > totalPages.value) {
    pageInput.value = String(currentPage.value)
  } else {
    goToPage(page)
  }
}

function onPageSizeChange(size: number) {
  emit('update:pageSize', size)
  // Reset to first page when changing page size
  currentPage.value = 1
  pageInput.value = "1"
  emit('update:pageIndex', 0)
}

// Watch for prop changes
watch(() => props.pageIndex, (newIndex) => {
  currentPage.value = newIndex + 1
  pageInput.value = String(currentPage.value)
})

watch(() => props.pageSize, (newSize) => {
  selectedPageSize.value = newSize
})

// Keyboard navigation
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || (document.activeElement?.tagName === 'INPUT')) {
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
        goToPrevPage()
        break
      case 'ArrowRight':
        goToNextPage()
        break
      case 'Home':
        goToFirstPage()
        break
      case 'End':
        goToLastPage()
        break
    }
  }

  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})
</script>

<style scoped>
.page-size-selector {
  min-width: 120px;
}
</style>
