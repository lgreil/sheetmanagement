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
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th
                                    v-for="col in columns"
                                    :key="col.name"
                                    scope="col"
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
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
                        <tbody v-if="filteredAndSortedPieces.length" class="bg-white divide-y divide-gray-200">
                            <tr
                                v-for="piece in filteredAndSortedPieces"
                                :key="piece.stid"
                                class="hover:bg-gray-50 cursor-pointer"
                                @click="onRowSelect(piece)"
                            >
                                <td v-for="col in columns" :key="col.name" class="px-6 py-4 whitespace-nowrap text-sm">
                                    <template v-if="col.format">
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
                                <td :colspan="columns.length" class="px-6 py-12 text-center">
                                    <div class="flex flex-col items-center justify-center">
                                        <UIcon
                                            name="i-heroicons-document-text"
                                            class="w-12 h-12 text-gray-400 mb-4"
                                        />
                                        <h3 class="text-lg font-medium text-gray-900">
                                            {{ searchQuery ? "No matching music pieces found" : "No music pieces found" }}
                                        </h3>
                                        <p class="mt-2 text-sm text-gray-500">
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
        </div>
    </ErrorBoundary>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core";
import type { Piece } from "~/types/Types";
import ErrorState from "@/components/MusicTable/ErrorState.vue";
import ErrorBoundary from "@/components/MusicTable/ErrorBoundary.vue";
import { computed, ref } from "vue";

const config = useRuntimeConfig();
const isDev = config.public.dev || false;

interface Props {
    pieces?: Piece[];
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    pieces: () => [],
    loading: false,
});

const emit = defineEmits<{
    "update:loading": [loading: boolean];
    "piece-click": [piece: Piece];
}>();

interface Column {
    name: keyof Piece;
    label: string;
    sortable: boolean;
    format?: (row: Piece) => string;
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
    },
    {
        name: 'jahr',
        label: 'Year',
        sortable: true,
    },
    {
        name: 'schwierigkeit',
        label: 'Difficulty',
        sortable: true,
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
    @apply rounded-lg overflow-hidden;
}

.search-wrapper {
    @apply p-4 border-b border-gray-200;
}

.music-table-wrapper {
    @apply relative overflow-x-auto;
}

.glass-panel {
    @apply bg-white bg-opacity-50 backdrop-blur-sm;
}

th {
    @apply transition-colors duration-200;
}

th:hover {
    @apply bg-gray-100;
}

tr {
    @apply transition-colors duration-200;
}
</style>

