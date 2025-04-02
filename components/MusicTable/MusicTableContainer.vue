<template>
    <ErrorBoundary>
        <div class="table-container glass-panel">
            <div class="search-wrapper">
                <UInput
                    v-model="searchQuery"
                    placeholder="Search across all columns"
                    :disabled="isLoading"
                    icon="i-heroicons-magnifying-glass"
                />
            </div>

            <div class="relative">
                <MusicTableSkeleton v-if="isLoading" />

                <ErrorState
                    v-else-if="error"
                    :error="error"
                    @dismiss="clearError"
                />

                <div v-else class="music-table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th
                                    v-for="col in columns"
                                    :key="col.name"
                                    scope="col"
                                    @click="sortBy = { column: col.name, direction: sortBy.direction === 'asc' ? 'desc' : 'asc' }"
                                >
                                    <div class="flex items-center gap-2">
                                        {{ col.label }}
                                        <UIcon
                                            v-if="sortBy.column === col.name"
                                            :name="sortBy.direction === 'asc' ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
                                            class="w-4 h-4"
                                        />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody v-if="filteredAndSortedPieces.length">
                            <tr
                                v-for="piece in filteredAndSortedPieces"
                                :key="piece.stid"
                                @click="onRowSelect(piece)"
                            >
                                <td v-for="col in columns" :key="col.name">
                                    <template v-if="col.component && col.props">
                                        <component :is="col.component" v-bind="col.props(piece)" />
                                    </template>
                                    <template v-else-if="col.format">
                                        {{ col.format(piece) }}
                                    </template>
                                    <template v-else>
                                        {{ piece[col.name] || '-' }}
                                    </template>
                                </td>
                            </tr>
                        </tbody>
                        <tbody v-else>
                            <tr>
                                <td :colspan="columns.length">
                                    <div class="empty-state">
                                        <UIcon
                                            name="i-heroicons-document-text"
                                            class="w-12 h-12 empty-state-icon"
                                        />
                                        <h3 class="empty-state-title">
                                            {{ searchQuery ? "No matching music pieces found" : "No music pieces found" }}
                                        </h3>
                                        <p class="empty-state-description">
                                            {{ searchQuery ? "Try adjusting your search terms" : "Add some music pieces to get started" }}
                                        </p>
                                        <div class="mt-6">
                                            <UButton
                                                v-if="!searchQuery"
                                                to="/stueck/new"
                                                icon="i-heroicons-plus"
                                                color="primary"
                                            >
                                                Add New Piece
                                            </UButton>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <MusicTablePagination
                v-if="!isLoading && !error"
                :total-items="totalItems"
                :page-size="pageSize"
                :page-index="pageIndex"
                @update:page-size="onPageSizeChange"
                @update:page-index="onPageIndexChange"
            />
        </div>
    </ErrorBoundary>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import type { Piece } from "~/types/Types";
import ErrorState from "@/components/MusicTable/ErrorState.vue";
import ErrorBoundary from "@/components/MusicTable/ErrorBoundary.vue";
import MusicTablePagination from "@/components/MusicTable/MusicTablePagination.vue";
import { computed, ref } from "vue";
import GenreBadge from "@/components/MusicTable/GenreBadge.vue";
import DifficultyIndicator from "@/components/MusicTable/DifficultyIndicator.vue";
import DigitizedIndicator from "@/components/MusicTable/DigitizedIndicator.vue";

const config = useRuntimeConfig();
const isDev = config.public.dev || false;

interface Props {
    pieces?: Piece[];
    loading?: boolean;
    totalItems?: number;
    pageSize?: number;
    pageIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
    pieces: () => [],
    loading: false,
    totalItems: 0,
    pageSize: 10,
    pageIndex: 0,
});

const emit = defineEmits<{
    "update:loading": [loading: boolean];
    "piece-click": [piece: Piece];
    "update:pageSize": [size: number];
    "update:pageIndex": [index: number];
}>();

interface Column {
    name: keyof Piece;
    label: string;
    sortable: boolean;
    format?: (row: Piece) => string;
    component?: any;
    props?: (row: Piece) => Record<string, any>;
}

const sortBy = ref({ column: 'name' as keyof Piece, direction: 'asc' });
const searchQuery = ref('');

const columns: Column[] = [
    {
        name: 'name',
        label: 'Title',
        sortable: true,
    },
    {
        name: 'genre',
        label: 'Genre',
        sortable: true,
        component: GenreBadge,
        props: (row: Piece) => ({ genre: row.genre || 'unknown' })
    },
    {
        name: 'schwierigkeit',
        label: 'Difficulty',
        sortable: true,
        component: DifficultyIndicator,
        props: (row: Piece) => ({ level: row.schwierigkeit?.toLowerCase() || 'unknown' })
    },
    {
        name: 'isdigitalisiert',
        label: 'Digitized',
        sortable: true,
        component: DigitizedIndicator,
        props: (row: Piece) => ({ isDigitized: row.isdigitalisiert || false })
    },
    {
        name: 'komponiert',
        label: 'Composer',
        sortable: true,
        format: (row: Piece) => row.komponiert?.map(k => `${k.vorname} ${k.name}`).join(", ") || "-"
    },
    {
        name: 'arrangiert',
        label: 'Arranger',
        sortable: true,
        format: (row: Piece) => row.arrangiert?.map(a => `${a.vorname} ${a.name}`).join(", ") || "-"
    }
];

const isLoading = useVModel(props, "loading", emit, { defaultValue: false });

const onRowSelect = (piece: Piece) => {
    emit("piece-click", piece);
};

const onPageSizeChange = (size: number) => {
    emit("update:pageSize", size);
};

const onPageIndexChange = (index: number) => {
    emit("update:pageIndex", index);
};

const filteredAndSortedPieces = computed(() => {
    let result = [...(props.pieces || [])];
    
    // Filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(piece => {
            return columns.some(col => {
                const value = col.format ? col.format(piece) : piece[col.name];
                return String(value).toLowerCase().includes(query);
            });
        });
    }
    
    // Sort
    result.sort((a, b) => {
        const col = columns.find(c => c.name === sortBy.value.column);
        if (!col) return 0;
        
        const aValue = col.format ? col.format(a) : a[col.name];
        const bValue = col.format ? col.format(b) : b[col.name];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const result = aValue > bValue ? 1 : -1;
        return sortBy.value.direction === 'asc' ? result : -result;
    });
    
    return result;
});

const { error, withErrorHandling, setError, clearError } = useTableError();
</script>

<style scoped>
.table-container {
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.search-wrapper {
    padding: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    background-color: var(--color-surface);
}

.music-table-wrapper {
    position: relative;
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}

thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: var(--color-surface);
    backdrop-filter: blur(8px);
}

th {
    padding: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-muted-text);
    transition: background-color 200ms ease;
    border-bottom: 2px solid var(--color-border);
    white-space: nowrap;
}

th:hover {
    background-color: var(--color-background);
    color: var(--color-text);
}

td {
    padding: 1rem;
    vertical-align: middle;
    transition: all 200ms ease;
}

tr {
    transition: background-color 200ms ease;
    border-bottom: 1px solid var(--color-border);
}

tr:last-child {
    border-bottom: none;
}

tbody tr:hover {
    background-color: var(--color-background);
}

.glass-panel {
    background-color: var(--color-surface);
    backdrop-filter: blur(8px);
    border: 1px solid var(--color-border);
}

/* Empty state styling */
.empty-state {
    padding: 3rem 1.5rem;
    text-align: center;
}

.empty-state-icon {
    margin-bottom: 1rem;
    color: var(--color-muted-text);
}

.empty-state-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.5rem;
}

.empty-state-description {
    color: var(--color-muted-text);
    margin-bottom: 1.5rem;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    th, td {
        padding: 0.75rem;
    }
    
    .search-wrapper {
        padding: 1rem;
    }
}
</style>

