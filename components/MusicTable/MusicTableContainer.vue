<template>
    <div class="w-full max-w-7xl mx-auto space-y-6 p-4">
        <!-- Search Component -->
        <MusicTableSearch v-model="globalFilter" />

        <!-- Loading State -->
        <template v-if="loading">
            <div
                class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div class="overflow-x-auto">
                    <table class="w-full table-auto">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700">
                                <th class="px-4 py-2" v-for="n in 7" :key="n">
                                    <USkeleton :class="n === 1
                                            ? 'h-6 w-[150px]'
                                            : n === 2
                                                ? 'h-6 w-[100px]'
                                                : n === 3
                                                    ? 'h-6 w-[120px]'
                                                    : n === 4
                                                        ? 'h-6 w-[80px]'
                                                        : n === 5
                                                            ? 'h-6 w-[100px]'
                                                            : n === 6
                                                                ? 'h-6 w-[120px]'
                                                                : 'h-6 w-[80px]'
                                        " />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="n in 10" :key="n" class="border-t border-gray-200 dark:border-gray-700">
                                <td class="px-4 py-3" v-for="m in 7" :key="m">
                                    <USkeleton :class="m === 1
                                            ? 'h-5 w-[180px]'
                                            : m === 2
                                                ? 'h-5 w-[100px] rounded-full'
                                                : m === 3
                                                    ? 'h-5 w-[140px]'
                                                    : m === 4
                                                        ? 'h-5 w-[60px] rounded-full'
                                                        : m === 5
                                                            ? 'h-5 w-8 rounded-full'
                                                            : m === 6
                                                                ? 'h-5 w-[120px]'
                                                                : 'h-5 w-[80px]'
                                        " />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <!-- Skeleton Pagination -->
                <div class="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                    <USkeleton class="h-8 w-[120px]" />
                    <USkeleton class="h-8 w-[200px]" />

                </div>
            </div>
        </template>

        <!-- Loaded Data -->
        <template v-else>
            <div
                class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <!-- Table Component -->
                <div class="overflow-x-auto">
                    <UTable :columns="columns" :data="pieces" :sort="sorting" @update:sort="handleSortChange" hover
                        class="w-full table-auto" />
                </div>
                <!-- Pagination Component -->
                <MusicTablePagination v-model:page-index="pageIndex" v-model:page-size="pageSize"
                    :total-items="totalItems" />
            </div>
        </template>
    </div>

    <!-- Dev Loading Toggle Button -->
    <div class="fixed bottom-4 right-4">
        <UButton color="neutral" @click="toggleLoading" class="px-4 py-2 text-sm font-medium">
            Toggle Loading State
        </UButton>
    </div>
</template>

<script setup lang="ts">
import { defineProps, ref, watch, onMounted } from 'vue';
import MusicTableSearch from "./MusicTableSearch.vue";
import MusicTablePagination from "./MusicTablePagination.vue";
import { useMusicTable } from "~/composables/useMusicTable";
import type { Piece } from "~/types/music";
import { useFetch } from "#app";

// Define props for the component
const props = defineProps({
  pieces: {
    type: Array as () => Piece[],
    required: false,
    default: () => [],
  },
  loading: {
    type: Boolean,
    required: false,
    default: false,
  },
});

// Table state
const pieces = useState<Piece[]>('pieces', () => props.pieces);
const loading = useState('loading', () => props.loading);
const error = ref<Error | null>(null);
const pageIndex = ref(0);
const pageSize = ref(10);
const globalFilter = ref("");
const sorting = ref<{ id: string; desc: boolean }[]>([]);
const totalItems = ref(0);

// Define columns for the table
const columns = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'genre', label: 'Genre', sortable: true },
  { id: 'schwierigkeit', label: 'Difficulty', sortable: true },
  { id: 'isdigitalisiert', label: 'Digitized', sortable: false },
  { id: 'jahr', label: 'Year', sortable: true },
  { id: 'composer_names', label: 'Composers', sortable: false },
  { id: 'arranger_names', label: 'Arrangers', sortable: false },
];

// Fetch data from API using query parameters
async function fetchData() {
    loading.value = true;
    error.value = null;
    try {
        const params = new URLSearchParams();
        params.append("page", pageIndex.value.toString());
        params.append("size", pageSize.value.toString());
        if (globalFilter.value) {
            params.append("search", globalFilter.value);
        }
        if (sorting.value.length > 0) {
            params.append("sortBy", sorting.value[0].id);
            params.append("sortDir", sorting.value[0].desc ? "desc" : "asc");
        }
        const { data, error: fetchError } = await useFetch<{
            items: any[];
            total: number;
        }>(`http://localhost:3005/stuecke?${params.toString()}`);
        if (fetchError.value) {
            throw fetchError.value;
        }
        if (data.value) {
            pieces.value = data.value.items.map((item: any) => ({
                stid: item.stid,
                name: item.name,
                genre: item.genre || "Unknown",
                schwierigkeit: item.schwierigkeit || "Unknown",
                isdigitalisiert: item.isdigitalisiert || false,
                jahr: item.jahr || "Unknown",
                composer_names: item.komponiert.map((k: any) => `${k.person.vorname} ${k.person.name}`),
                arranger_names: item.arrangiert.map((a: any) => `${a.person.vorname} ${a.person.name}`),
            }));
            totalItems.value = data.value.total || 0;
        }
    } catch (err) {
        console.error("Error fetching data:", err);
        error.value = err as Error;
    } finally {
        loading.value = false;
    }
}

// Event Handlers
function handleSortChange(newSort: { id: string; desc: boolean }[]) {
    sorting.value = newSort;
    fetchData();
}

function toggleLoading() {
    loading.value = !loading.value;
}

// Watchers: re-fetch data when pagination or search changes
watch([pageIndex, pageSize], () => {
    fetchData();
});

watch(globalFilter, () => {
    pageIndex.value = 0;
    fetchData();
});

// Initial fetch on mount
onMounted(() => {
    fetchData();
});
</script>

<script lang="ts">
export default {
  emits: ["update:loading", "piece-click"],
};
</script>

<style>
/* Add this to your component's <style> section or to your global CSS */
@media (max-width: 768px) {
    .music-table-container {
        border-radius: 0.5rem;
    }

    .music-table-row td {
        padding: 0.75rem 0.5rem;
    }

    .genre-badge,
    .difficulty-badge {
        padding: 0.2rem 0.5rem;
        font-size: 0.7rem;
    }
}

.digitized-indicator {
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.digitized-indicator.yes {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
    }

    70% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
}

.genre-badge {
    transform: translateY(0);
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.genre-badge:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.music-table-header-btn {
    position: relative;
    overflow: hidden;
}

.music-table-header-btn:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background-color: #3b82f6;
    transition: width 0.3s ease;
}

.music-table-header-btn:hover:after,
.music-table-header-btn.active:after {
    width: 100%;
}

.music-table-row {
    transition: background-color 0.3s ease;
}

.music-table-row:hover {
    background-color: rgba(30, 58, 138, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Main container styling with dark mode support */
.music-table-container {
    background-image: linear-gradient(145deg, #1e3a8a, #1e40af);
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.2),
        0 8px 10px -6px rgba(0, 0, 0, 0.1),
        inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

/* Button styling for column headers */
.music-table-header-btn {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    width: 100%;
}

.music-table-header-btn:hover {
    background-color: rgba(30, 58, 138, 0.5);
}

.music-table-header-btn.active {
    background-color: rgba(30, 58, 138, 0.7);
}

/* Search input styling */
.music-search-input {
    background-color: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(30, 58, 138, 0.3);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    transition: all 0.3s ease;
    color: white;
    width: 100%;
}

.music-search-input:focus-within {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    background-color: rgba(255, 255, 255, 0.15);
    border-color: rgba(59, 130, 246, 0.5);
}

.music-search-input input {
    background-color: transparent;
    border: none;
    outline: none;
    width: 100%;
    color: white;
}

.music-search-input input::placeholder {
    color: rgba(255, 255, 255, 0.5);
}

/* Genre badge styling */
.genre-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.3s;
}

.genre-badge.traditionell {
    background-image: linear-gradient(to right, #059669, #047857);
    color: white;
}

.genre-badge.klassik {
    background-image: linear-gradient(to right, #4f46e5, #7c3aed);
    color: white;
}

.genre-badge.barock {
    background-image: linear-gradient(to right, #d97706, #b45309);
    color: white;
}

.genre-badge.moderne-klassik {
    background-image: linear-gradient(to right, #06b6d4, #3b82f6);
    color: white;
}

.genre-badge.romantik {
    background-image: linear-gradient(to right, #f43f5e, #e11d48);
    color: white;
}

.genre-badge.musicals {
    background-image: linear-gradient(to right, #8b5cf6, #7c3aed);
    color: white;
}

.genre-badge.pop-rock-modern {
    background-image: linear-gradient(to right, #f87171, #ef4444);
    color: white;
}

.genre-badge.weihnachtsmusik {
    background-image: linear-gradient(to right, #34d399, #10b981);
    color: white;
}

.genre-badge.filmmusik {
    background-image: linear-gradient(to right, #f59e0b, #d97706);
    color: white;
}

/* Difficulty badge styling */
.difficulty-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
}

.difficulty-badge.unknown {
    background-color: rgba(107, 114, 128, 0.5);
    color: white;
}

.difficulty-badge.medium {
    background-image: linear-gradient(to right, #f59e0b, #ea580c);
    color: white;
}

/* Digitized indicator */
.digitized-indicator {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
}

.digitized-indicator.yes {
    background-color: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.digitized-indicator.no {
    background-color: #9ca3af;
}

/* Table row styling */
.music-table-row {
    border-bottom: 1px solid rgba(30, 58, 138, 0.3);
    transition: color 0.2s;
}

.music-table-row:hover {
    background-color: rgba(30, 58, 138, 0.2);
}

.music-table-row td {
    padding: 1rem;
}

/* Pagination styling - improved buttons */
.pagination-button {
    background-color: rgba(30, 58, 138, 0.3);
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    color: white;
    transition: color 0.2s;
    position: relative;
    overflow: hidden;
    z-index: 1;
}

.pagination-button:before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
            rgba(59, 130, 246, 0.2),
            rgba(37, 99, 235, 0.4));
    transition: left 0.3s ease;
    z-index: -1;
}

.pagination-button:hover:before {
    left: 0;
}

.pagination-button:hover {
    background-color: rgba(30, 58, 138, 0.5);
}

.pagination-button.active {
    box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
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
