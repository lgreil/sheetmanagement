<template>
  <ErrorBoundary>
    <div class="w-full max-w-7xl mx-auto space-y-6 p-4">
      <div class="sticky top-0 z-20 -mx-4 px-4 py-2">
        <MusicTableSearch v-model="globalFilter"
          @update:model-value="(value) => updateFilters({ globalFilter: value })" :disabled="isLoading" />
      </div>

      <TransitionGroup :show="true" name="fade" tag="div" class="flex flex-col h-full"
        enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 -translate-y-4">
        <MusicTableSkeleton v-if="isLoading" key="skeleton" />

        <ErrorState v-else-if="error" :key="error.message" :error="error" @dismiss="clearError" />

        <div v-else class="music-table-container rounded-lg shadow-lg overflow-hidden" key="table">
          <UTable v-if="!shouldUseVirtualScroll" :rows="paginatedItems" :columns="columns" :loading="isLoading"
            :sort="state.sorting" :search="globalFilter" :loading-state="{
              icon: 'i-heroicons-document-text',
              label: 'Loading music pieces...'
            }" :empty-state="{
              icon: 'i-heroicons-document-text',
              title: 'No music pieces found',
              description: globalFilter 
                ? 'Try adjusting your search terms'
                : 'Add some music pieces to get started'
            }" @select="(row) => onRowSelect(row)" @update:sort="(sort: TableSort[]) => updateFilters({ sorting: sort })"
            @update:search="(value: string) => updateFilters({ globalFilter: value })" :ui="tableUI">
            <!-- Add header slot to customize header rendering -->
            <template #header-cell="{ column }">
              <div class="flex items-center gap-2">
                {{ column.label }}
                <UIcon v-if="column.sortable" name="i-heroicons-arrows-up-down" class="w-4 h-4 text-gray-400" />
              </div>
            </template>
            <template #empty-state="{ icon, title, description = '' }">
              <div class="flex flex-col items-center justify-center p-12 text-center">
                <UIcon :name="icon" class="w-12 h-12 text-gray-400 mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">{{ title }}</h3>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ description }}</p>
                <div class="mt-6">
                  <UButton v-if="!globalFilter" to="/stueck/new" icon="i-heroicons-plus" color="primary">
                    Add New Piece
                  </UButton>
                </div>
              </div>
            </template>
          </UTable>

          <div v-else class="virtual-table-wrapper">
            <div class="sticky top-0 z-10 bg-blue-900/95 backdrop-blur">
              <table class="w-full">
                <thead>
                  <tr>
                    <th v-for="column in columns" :key="column.id" 
                        class="transition-colors whitespace-nowrap sticky top-0 bg-blue-900/95 backdrop-blur supports-[backdrop-filter]:bg-blue-900/75 z-10 px-3 py-2 sm:px-4 sm:py-3 text-white font-medium"
                        @click="column.sortable && updateFilters({ sorting: [{ id: column.id, desc: state.sorting[0]?.desc ? false : true }] })">
                      <div class="flex items-center gap-2">
                        {{ column.label }}
                        <UIcon v-if="column.sortable" 
                               :name="getSortIcon(column.id || '')"
                               class="w-4 h-4 text-gray-400" />
                      </div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            <VirtualTable ref="virtualTable" :items="paginatedItems" :item-height="48" class="virtual-table-content"
              v-slot="{ item, index }" @scroll="onScroll">
              <tr class="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                :class="{ 'bg-blue-900/20': selectedRowIndex === index }"
                :tabindex="index === selectedRowIndex ? 0 : -1" @click="() => onRowSelect(item)">
                <td v-for="column in columns" :key="column.id"
                  class="transition-colors whitespace-nowrap sm:whitespace-normal px-3 py-2 sm:px-4 sm:py-3">
                  <component v-if="column.render" :is="column.render(item)" />
                  <template v-else>
                    {{ column.accessor ? column.accessor(item) : item[column.id] }}
                  </template>
                </td>
              </tr>
            </VirtualTable>
          </div>

          <MusicTablePagination v-model:page-index="state.pageIndex" v-model:page-size="state.pageSize"
            :total-items="totalItems" @update:page-index="(index) => updateFilters({ pageIndex: index })"
            @update:page-size="(size) => updateFilters({ pageSize: size })" />

          <!-- Performance Debug Info (Dev Only) -->
          <div v-if="isDev && showDebugInfo"
            class="fixed bottom-16 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <pre class="text-xs">{{ debugInfo }}</pre>
          </div>
        </div>
      </TransitionGroup>

      <!-- Dev Tools -->
      <ClientOnly>
        <div v-if="isDev" class="fixed bottom-4 right-4 space-y-2">
          <UButton color="neutral" @click="toggleLoading" class="w-full" :variant="isLoading ? 'solid' : 'outline'">
            Toggle Loading
          </UButton>
          <UButton color="warning" @click="simulateError" variant="outline" class="w-full">
            Simulate Error
          </UButton>
        </div>
      </ClientOnly>
    </div>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { useVModel } from '@vueuse/core'
import type { Piece } from '~/types/Types'
import type { TableSort, TableRow, TableColumn } from '~/types/table'
import { useMusicTable } from '~/composables/useMusicTable'
import { useTableError } from '~/composables/useTableError'
import type { TableError } from '~/composables/useTableError'
import { useTableAnimations } from '~/composables/useTableAnimations'
import { useTablePerformance } from '~/composables/useTablePerformance'
import VirtualTable from './VirtualTable.vue'
import ErrorBoundary from './ErrorBoundary.vue'
import ErrorState from './ErrorState.vue'

// Add useRuntimeConfig
const config = useRuntimeConfig()
const isDev = config.public.dev || false

// Props with better TypeScript support
interface Props {
  initialPieces?: Piece[]
  modelValue?: Piece[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialPieces: () => [],
  modelValue: undefined,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [pieces: Piece[]]
  'piece-click': [piece: Piece]
}>()

// State management
const pieces = useVModel(props, 'modelValue', emit, { 
  defaultValue: props.initialPieces 
})

// Initialize composables
const {
  state,
  columns,
  totalItems,
  paginatedItems,
  setPieces,
  updateFilters
} = useMusicTable()

// Initialize pieces when received through props
watchEffect(() => {
  if (pieces.value?.length) {
    setPieces(pieces.value)
  }
})

const {
  error,
  withErrorHandling,
  setError,
  clearError
} = useTableError()

const isLoading = useVModel(props, 'loading', emit, { defaultValue: false })

const { 
  smoothScrollToRow, 
  handleTouchStart, 
  handleTouchMove 
} = useTableAnimations()

// Performance optimizations
const {
  renderTime,
  fps,
  isScrolling,
  measureRenderTime,
  measureFPS,
  onScroll,
  debugInfo
} = useTablePerformance()

const virtualTable = ref()
const showDebugInfo = ref(false)

// Determine when to use virtual scrolling
const VIRTUAL_SCROLL_THRESHOLD = 100
const shouldUseVirtualScroll = computed(() => 
  paginatedItems.value.length > VIRTUAL_SCROLL_THRESHOLD
)

// Computed property for globalFilter
const globalFilter = computed({
  get: () => state.value.globalFilter,
  set: (value) => updateFilters({ globalFilter: value })
})

// Event handlers with proper error handling
const onRowSelect = async (row: TableRow<Piece>) => {
  try {
    const piece = row.original // Extract the Piece object from the TableRow
    emit('piece-click', piece)
    selectedRowIndex.value = paginatedItems.value.findIndex(p => p.stid === piece.stid)
  } catch (err) {
    setError({
      message: 'Failed to select piece',
      type: 'error',
      code: 'ROW_SELECT_ERROR',
      retry: () => Promise.resolve()
    })
  }
}

// Navigation state
const selectedRowIndex = ref(-1)

// Touch gesture handler for mobile
const handleTouchSwipe = (direction: 'left' | 'right') => {
  if (direction === 'left' && canGoForward.value) {
    updateFilters({ pageIndex: state.value.pageIndex + 1 })
  } else if (direction === 'right' && canGoBack.value) {
    updateFilters({ pageIndex: state.value.pageIndex - 1 })
  }
}

// Computed values for navigation
const canGoForward = computed(() => 
  state.value.pageIndex < Math.ceil(totalItems.value / state.value.pageSize) - 1
)
const canGoBack = computed(() => state.value.pageIndex > 0)

// Keyboard navigation
function handleKeyboardNavigation(e: KeyboardEvent) {
  if (!paginatedItems.value.length) return

  // Only handle keyboard navigation when table is focused
  const tableElement = document.querySelector('.music-table-container')
  if (!tableElement?.contains(document.activeElement)) return

  const handlers: Record<string, () => void> = {
    ArrowDown: () => {
      selectedRowIndex.value = Math.min(
        selectedRowIndex.value + 1,
        paginatedItems.value.length - 1
      )
      focusSelectedRow()
    },
    ArrowUp: () => {
      selectedRowIndex.value = Math.max(selectedRowIndex.value - 1, 0)
      focusSelectedRow()
    },
    Enter: () => {
      if (selectedRowIndex.value >= 0) {
        onRowSelect(paginatedItems.value[selectedRowIndex.value])
      }
    },
    PageDown: () => {
      if (canGoForward.value) {
        updateFilters({ pageIndex: state.value.pageIndex + 1 })
        selectedRowIndex.value = 0
        focusSelectedRow()
      }
    },
    PageUp: () => {
      if (canGoBack.value) {
        updateFilters({ pageIndex: state.value.pageIndex - 1 })
        selectedRowIndex.value = 0
        focusSelectedRow()
      }
    },
    Home: () => {
      if (e.ctrlKey) {
        updateFilters({ pageIndex: 0 })
        selectedRowIndex.value = 0
      } else {
        selectedRowIndex.value = 0
      }
      focusSelectedRow()
    },
    End: () => {
      if (e.ctrlKey) {
        const lastPage = Math.ceil(totalItems.value / state.value.pageSize) - 1
        updateFilters({ pageIndex: lastPage })
        selectedRowIndex.value = 0
      } else {
        selectedRowIndex.value = paginatedItems.value.length - 1
      }
      focusSelectedRow()
    }
  }

  const handler = handlers[e.key]
  if (handler) {
    e.preventDefault()
    handler()
  }
}

function focusSelectedRow() {
  nextTick(() => {
    if (shouldUseVirtualScroll.value && virtualTable.value) {
      virtualTable.value.scrollTo(selectedRowIndex.value)
    } else {
      const rows = document.querySelectorAll('.music-table-container tbody tr')
      const row = rows[selectedRowIndex.value] as HTMLElement
      if (row) {
        row.focus()
        smoothScrollToRow(row)
      }
    }
  })
}

// Lifecycle hooks
onMounted(() => {
  // Initialize data
  if (pieces.value?.length) {
    withErrorHandling(
      async () => setPieces(pieces.value!),
      'Failed to load music pieces'
    )
  }

  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyboardNavigation)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardNavigation)
})

// Watch for external changes
watch(() => pieces.value, (newPieces) => {
  if (newPieces?.length) {
    setPieces(newPieces)
  }
}, { deep: true })

// Development helpers
const toggleLoading = () => {
  if (isDev) {
    isLoading.value = !isLoading.value
  }
}

const simulateError = () => {
  if (isDev) {
    setError({
      message: 'This is a simulated error',
      type: 'error',
      code: 'SIMULATED_ERROR',
      // debug: new Error().stack, // Removed as 'debug' is not part of 'TableError'
      retry: () => {
        clearError()
        return Promise.resolve()
      }
    })
  }
}

function toggleDebugInfo() {
  showDebugInfo.value = !showDebugInfo.value
  if (showDebugInfo.value) {
    measureFPS()
  }
}

// Add performance monitoring in development
if (isDev) {
  onMounted(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'measure' && entry.name === 'render') {
          measureRenderTime()
        }
      })
    })
    observer.observe({ entryTypes: ['measure'] })
  })
}

const getSortIcon = (columnKey: string) => {
  const currentSort = state.value.sorting[0]
  if (!currentSort || currentSort.id !== columnKey) {
    return 'i-heroicons-arrows-up-down'
  }
  return currentSort.desc ? 'i-heroicons-arrow-down' : 'i-heroicons-arrow-up'
}

// Update UTable UI configuration
const tableUI = {
  root: 'relative overflow-x-auto sm:overflow-visible',
  base: 'min-h-[400px] w-full',
  td: 'transition-colors whitespace-nowrap sm:whitespace-normal group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 px-3 py-2 sm:px-4 sm:py-3',
  th: 'transition-colors whitespace-nowrap sticky top-0 bg-blue-900/95 backdrop-blur supports-[backdrop-filter]:bg-blue-900/75 z-10 px-3 py-2 sm:px-4 sm:py-3 text-white font-medium',
  tr: 'group focus-within:bg-blue-900/30 outline-none transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-blue-900/20',
  loadingWrapper: 'flex flex-col items-center justify-center flex-1 px-6 py-14',
  loadingLabel: 'text-sm text-gray-900 dark:text-white',
  loadingIcon: 'w-6 h-6 text-gray-400 dark:text-gray-500 mb-4 animate-spin',
  emptyWrapper: 'flex flex-col items-center justify-center flex-1 px-6 py-14',
  emptyLabel: 'text-sm text-gray-900 dark:text-white',
  emptyIcon: 'w-6 h-6 text-gray-400 dark:text-gray-500 mb-4'
} as const
</script>

<style scoped>
/* Add touch feedback */
.music-table-container {
  touch-action: pan-y pinch-zoom;
}

@media (hover: hover) {
  .music-table-row:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* Optimize transitions for performance */
.music-table-row {
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  will-change: transform, background-color;
}

/* Smooth scrolling for keyboard navigation */
.music-table-container {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Improve touch targets on mobile */
@media (max-width: 640px) {
  .music-table-row td {
    min-height: 48px;
  }
  
  .music-table-container {
    margin-left: -1rem;
    margin-right: -1rem;
    border-radius: 0;
  }
}

/* Virtual scroll container height */
.virtual-table-container {
  height: calc(100vh - 300px); /* Adjust based on your layout */
  min-height: 400px;
}

/* Add container query support for better responsive design */
@container (min-width: 640px) {
  .music-table-container {
    container-type: inline-size;
  }
}

/* Virtual scroll styling */
.virtual-table-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 300px);
  min-height: 400px;
  overflow: hidden;
}

.virtual-table-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.virtual-table-content tr {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  align-items: center;
}

@media (min-width: 640px) {
  .virtual-table-content tr {
    display: table-row;
  }
}

/* Improve virtual scroll performance */
.virtual-table-content {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

</style>
