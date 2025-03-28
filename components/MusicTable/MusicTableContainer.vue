<template>
    <ErrorBoundary>
        <div class="table-container glass-panel">
            <div class="search-wrapper">
                <MusicTableSearch
                    v-model="globalFilter"
                    @update:model-value="
                        (value) => updateFilters({ globalFilter: value })
                    "
                    :disabled="isLoading"
                />
            </div>

            <TransitionGroup
                name="fade"
                tag="div"
                class="table-transition-group"
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-4"
            >
                <MusicTableSkeleton v-if="isLoading" key="skeleton" />

                <ErrorState
                    v-else-if="error"
                    :key="error.message"
                    :error="error"
                    @dismiss="clearError"
                />

                <div v-else key="table" class="music-table-wrapper">
                    <UTable
                        v-if="!shouldUseVirtualScroll"
                        :data="paginatedItems"
                        :columns="columnsWithAccessor"
                        :loading="isLoading"
                        :sorting="state.sorting"
                        :globalFilter="globalFilter"
                        :empty="
                            globalFilter
                                ? 'No matching music pieces found'
                                : 'No music pieces found'
                        "
                        @rowClick="onRowSelect"
                        @update:sorting="
                            (sorting) => updateFilters({ sorting })
                        "
                        @update:globalFilter="
                            (value) => updateFilters({ globalFilter: value })
                        "
                        :ui="tableUI"
                    >
                        <template #thead-tr="{ row }">
                            <th
                                v-for="column in row.cells"
                                :key="column.id"
                                class="table-header-cell"
                                scope="col"
                            >
                                <div class="flex items-center gap-2">
                                    {{ column.column.meta?.label }}
                                    <UIcon
                                        v-if="column.column.meta?.sortable"
                                        :name="getSortIcon(column.column.id)"
                                        class="w-4 h-4 text-muted-text"
                                    />
                                </div>
                            </th>
                        </template>
                        <template #empty>
                            <div
                                class="flex flex-col items-center justify-center p-12 text-center"
                            >
                                <UIcon
                                    name="i-heroicons-document-text"
                                    class="w-12 h-12 text-muted-text mb-4 animate-pulse-slow"
                                />
                                <h3 class="text-lg font-medium text-text">
                                    {{
                                        globalFilter
                                            ? "No matching music pieces found"
                                            : "No music pieces found"
                                    }}
                                </h3>
                                <p class="mt-2 text-sm text-muted-text">
                                    {{
                                        globalFilter
                                            ? "Try adjusting your search terms"
                                            : "Add some music pieces to get started"
                                    }}
                                </p>
                                <div class="mt-6">
                                    <UButton
                                        v-if="!globalFilter"
                                        to="/stueck/new"
                                        icon="i-heroicons-plus"
                                        color="primary"
                                        class="add-button"
                                    >
                                        Add New Piece
                                    </UButton>
                                </div>
                            </div>
                        </template>
                        <template #loading>
                            <div class="flex items-center justify-center p-12">
                                <UIcon
                                    name="i-heroicons-document-text"
                                    class="w-8 h-8 text-primary mr-3 animate-pulse"
                                />
                                <span>Loading music pieces...</span>
                            </div>
                        </template>
                    </UTable>

                    <div v-else class="virtual-table-container">
                        <div class="virtual-table-header">
                            <table class="w-full">
                                <thead>
                                    <tr>
                                        <th
                                            v-for="column in columns"
                                            :key="column.id"
                                            class="table-header-cell"
                                            @click="
                                                (column as ExtendedColumn)
                                                    .sortable &&
                                                updateFilters({
                                                    sorting: [
                                                        {
                                                            id: column.id!,
                                                            desc: state
                                                                .sorting[0]
                                                                ?.desc
                                                                ? false
                                                                : true,
                                                        },
                                                    ],
                                                })
                                            "
                                            scope="col"
                                        >
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                {{
                                                    (column as ExtendedColumn)
                                                        .label
                                                }}
                                                <UIcon
                                                    v-if="
                                                        (
                                                            column as ExtendedColumn
                                                        ).sortable
                                                    "
                                                    :name="
                                                        getSortIcon(
                                                            column.id || '',
                                                        )
                                                    "
                                                    class="w-4 h-4 text-muted-text"
                                                />
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        <div
                            ref="virtualTable"
                            class="virtual-table-content"
                            @scroll="onScroll"
                        ></div>
                    </div>

                    <MusicTablePagination
                        v-model:page-index="state.pageIndex"
                        v-model:page-size="state.pageSize"
                        :total-items="totalItems"
                        @update:page-index="
                            (index) => updateFilters({ pageIndex: index })
                        "
                        @update:page-size="
                            (size) => updateFilters({ pageSize: size })
                        "
                    />

                    <div v-if="isDev && showDebugInfo" class="debug-info">
                        <pre class="text-xs">{{ debugInfo }}</pre>
                    </div>
                </div>
            </TransitionGroup>

            <ClientOnly>
                <div v-if="isDev" class="dev-tools">
                    <UButton
                        color="neutral"
                        @click="toggleLoading"
                        class="w-full dev-button neutral-button"
                        :variant="isLoading ? 'solid' : 'outline'"
                    >
                        Toggle Loading
                    </UButton>
                    <UButton
                        color="warning"
                        @click="simulateError"
                        variant="outline"
                        class="w-full dev-button warning-button"
                    >
                        Simulate Error
                    </UButton>
                    <UButton
                        color="primary"
                        @click="toggleDebugInfo"
                        class="w-full dev-button primary-button"
                    >
                        Toggle Debug Info
                    </UButton>
                </div>
            </ClientOnly>
        </div>
    </ErrorBoundary>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import type { TableSort } from "@/types/table";
import type { Row } from "@tanstack/vue-table";
import type { ColumnDef } from "@tanstack/table-core";
import type { Piece } from "@/types/piece";
import VirtualTable from "@/components/MusicTable/VirtualTable.vue";
import ErrorState from "@/components/MusicTable/ErrorState.vue";
import ErrorBoundary from "@/components/MusicTable/ErrorBoundary.vue";

const config = useRuntimeConfig();
const isDev = config.public.dev || false;

interface Props {
    initialPieces?: Piece[];
    modelValue?: Piece[];
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    initialPieces: () => [],
    modelValue: undefined,
    loading: false,
});

const emit = defineEmits<{
    "update:modelValue": [pieces: Piece[]];
    "piece-click": [piece: Piece];
}>();

const pieces = useVModel(props, "modelValue", emit, {
    defaultValue: props.initialPieces,
});

const { state, totalItems, paginatedItems, setPieces, updateFilters } =
    useMusicTable();

type ExtendedColumn = ColumnDef<Piece> & {
    label: string;
    sortable?: boolean;
};

const columns = ref<ExtendedColumn[]>([
    {
        id: "name",
        label: "Title",
        sortable: true,
    },
    {
        id: "genre",
        label: "Genre",
        sortable: true,
    },
    {
        id: "jahr",
        label: "Year",
        sortable: true,
    },
]);

// Add accessors and key properties to columns for UTable
const columnsWithAccessor = computed(() => {
    return columns.value.map((col) => ({
        ...col,
        key: col.id,
        accessor: (row: Piece) => row[col.id as keyof Piece],
        meta: {
            label: col.label,
            sortable: col.sortable,
        },
    }));
});

watchEffect(() => {
    if (pieces.value?.length) {
        setPieces(pieces.value);
    }
});

const { error, withErrorHandling, setError, clearError } = useTableError();

const isLoading = useVModel(props, "loading", emit, { defaultValue: false });

const { smoothScrollToRow } = useTableAnimations();

const {
    renderTime,
    fps,
    isScrolling,
    measureRenderTime,
    measureFPS,
    onScroll,
    debugInfo,
} = useTablePerformance();

const virtualTable = ref<any>();
const showDebugInfo = ref(false);

const VIRTUAL_SCROLL_THRESHOLD = 100;
const shouldUseVirtualScroll = computed(
    () => paginatedItems.value.length > VIRTUAL_SCROLL_THRESHOLD,
);

const globalFilter = computed({
    get: () => state.globalFilter,
    set: (value) => updateFilters({ globalFilter: value }),
});

const onRowSelect = (piece: Piece) => {
    try {
        emit("piece-click", piece);
        selectedRowStid.value = String(piece.stid);
    } catch (err: any) {
        setError({
            message: "Failed to select piece",
            type: "error",
            code: "ROW_SELECT_ERROR",
            retry: () => Promise.resolve(),
        });
    }
};

const selectedRowStid = ref<string | null>(null);

const handleTouchSwipe = (direction: "left" | "right") => {
    if (direction === "left" && canGoForward.value) {
        updateFilters({ pageIndex: state.pageIndex + 1 });
    } else if (direction === "right" && canGoBack.value) {
        updateFilters({ pageIndex: state.pageIndex - 1 });
    }
};

const canGoForward = computed(
    () => state.pageIndex < Math.ceil(totalItems.value / state.pageSize) - 1,
);
const canGoBack = computed(() => state.pageIndex > 0);

function handleKeyboardNavigation(e: KeyboardEvent) {
    if (!paginatedItems.value.length) return;

    const tableElement = document.querySelector(".music-table-wrapper");
    if (!tableElement?.contains(document.activeElement)) return;

    const handlers: Record<string, () => void> = {
        ArrowDown: () => {
            const currentIndex = paginatedItems.value.findIndex(
                (item: Piece) => String(item.stid) === selectedRowStid.value,
            );
            const newIndex = Math.min(
                currentIndex + 1,
                paginatedItems.value.length - 1,
            );
            selectedRowStid.value = String(paginatedItems.value[newIndex].stid);
            focusSelectedRow();
        },
        ArrowUp: () => {
            const currentIndex = paginatedItems.value.findIndex(
                (item: Piece) => String(item.stid) === selectedRowStid.value,
            );
            const newIndex = Math.max(currentIndex - 1, 0);
            selectedRowStid.value = String(paginatedItems.value[newIndex].stid);
            focusSelectedRow();
        },
        Enter: () => {
            if (selectedRowStid.value) {
                const selectedPiece = paginatedItems.value.find(
                    (item: Piece) =>
                        String(item.stid) === selectedRowStid.value,
                );
                if (selectedPiece) {
                    onRowSelect(selectedPiece);
                }
            }
        },
        PageDown: () => {
            if (canGoForward.value) {
                updateFilters({ pageIndex: state.pageIndex + 1 });
                selectedRowStid.value = String(paginatedItems.value[0].stid);
                focusSelectedRow();
            }
        },
        PageUp: () => {
            if (canGoBack.value) {
                updateFilters({ pageIndex: state.pageIndex - 1 });
                selectedRowStid.value = String(paginatedItems.value[0].stid);
                focusSelectedRow();
            }
        },
        Home: () => {
            if (e.ctrlKey) {
                updateFilters({ pageIndex: 0 });
            }
            selectedRowStid.value = String(paginatedItems.value[0].stid);
            focusSelectedRow();
        },
        End: () => {
            if (e.ctrlKey) {
                const lastPage =
                    Math.ceil(totalItems.value / state.pageSize) - 1;
                updateFilters({ pageIndex: lastPage });
            }
            selectedRowStid.value = String(
                paginatedItems.value[paginatedItems.value.length - 1].stid,
            );
            focusSelectedRow();
        },
    };

    const handler = handlers[e.key];
    if (handler) {
        e.preventDefault();
        handler();
    }
}

function focusSelectedRow() {
    nextTick(() => {
        if (shouldUseVirtualScroll.value && virtualTable.value) {
            const index = paginatedItems.value.findIndex(
                (item: Piece) => String(item.stid) === selectedRowStid.value,
            );
            virtualTable.value.scrollTo(index);
        } else {
            const rows = document.querySelectorAll(
                ".music-table-wrapper tbody tr",
            );
            const index = paginatedItems.value.findIndex(
                (item: Piece) => String(item.stid) === selectedRowStid.value,
            );
            const row = rows[index] as HTMLElement;
            if (row) {
                row.focus();
                smoothScrollToRow(row);
            }
        }
    });
}

onMounted(() => {
    if (pieces.value?.length) {
        withErrorHandling(
            async () => setPieces(pieces.value!),
            "Failed to load music pieces",
        );
    }

    window.addEventListener("keydown", handleKeyboardNavigation);
});

onUnmounted(() => {
    window.removeEventListener("keydown", handleKeyboardNavigation);
});

watch(
    () => pieces.value,
    (newPieces) => {
        if (newPieces?.length) {
            setPieces(newPieces);
        }
    },
    { deep: true },
);

const toggleLoading = () => {
    if (isDev) {
        isLoading.value = !isLoading.value;
    }
};

const simulateError = () => {
    if (isDev) {
        setError({
            message: "This is a simulated error",
            type: "error",
            code: "SIMULATED_ERROR",
            retry: () => {
                clearError();
                return Promise.resolve();
            },
        });
    }
};

function toggleDebugInfo() {
    showDebugInfo.value = !showDebugInfo.value;
    if (showDebugInfo.value) {
        measureFPS();
    }
}

if (isDev) {
    onMounted(() => {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
                if (entry.entryType === "measure" && entry.name === "render") {
                    measureRenderTime();
                }
            });
        });
        observer.observe({ entryTypes: ["measure"] });
    });
}

const getSortIcon = (columnKey: string) => {
    const currentSort = state.sorting[0];
    if (!currentSort || currentSort.id !== columnKey) {
        return "i-heroicons-arrows-up-down";
    }
    return currentSort.desc ? "i-heroicons-arrow-down" : "i-heroicons-arrow-up";
};

interface EmptyState {
    icon: string;
    title: string;
    description?: string;
}

const tableUI = {
    root: "table-root",
    base: "table-base",
    td: "table-td",
    th: "table-th",
    tr: "table-tr",
    loadingWrapper: "table-loading-wrapper",
    loadingLabel: "table-loading-label",
    loadingIcon: "table-loading-icon",
    emptyWrapper: "table-empty-wrapper",
    emptyLabel: "table-empty-label",
    emptyIcon: "table-empty-icon",
} as const;

const renderEmptyState = (state: EmptyState) => ({
    icon: state.icon,
    title: state.title,
    description: state.description,
});
</script>

<style>
.selected-row {
    background-color: rgba(59, 130, 246, 0.1) !important;
    border-left: 3px solid var(--color-primary);
}

.table-data-cell {
    color: var(--color-text);
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
    transition: all 0.2s ease;
}

.table-header-cell {
    background-color: var(--color-surface);
    color: var(--color-muted-text);
    font-weight: 600;
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid var(--color-primary);
    transition: all 0.2s ease;
}

.virtual-table-container {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    overflow: hidden;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
}

.virtual-table-content {
    height: 450px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) var(--color-surface);
}

.virtual-table-content::-webkit-scrollbar {
    width: 8px;
}

.virtual-table-content::-webkit-scrollbar-track {
    background: var(--color-surface);
}

.virtual-table-content::-webkit-scrollbar-thumb {
    background-color: var(--color-primary);
    border-radius: 20px;
    border: 2px solid var(--color-surface);
}

.virtual-table-row {
    cursor: pointer;
    transition: all 0.2s ease;
}

.virtual-table-row:hover {
    background-color: rgba(59, 130, 246, 0.05);
    transform: translateY(-1px);
}

.glass-panel {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
    padding: 1.5rem;
    margin-bottom: 2rem;
}

.search-wrapper {
    margin-bottom: 1.5rem;
}

.add-button {
    transition: transform 0.2s ease;
    border-radius: 0.5rem;
    font-weight: 500;
    padding: 0.5rem 1.25rem;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.add-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4);
}

.animate-pulse-slow {
    animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
}

html.dark .glass-panel {
    background: rgba(31, 41, 55, 0.8);
}

@media (hover: hover) {
    .table-tr:hover .table-td {
        background-color: rgba(59, 130, 246, 0.05);
    }
}
</style>
