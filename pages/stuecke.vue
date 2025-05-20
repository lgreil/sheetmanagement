<!-- pages/music-collection.vue -->
<template>
    <div class="container mx-auto px-4 py-8">
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-4">
                <h1 class="text-2xl font-bold">Stücke</h1>
                <UBadge v-if="isUsingDummyData" color="warning" variant="soft">
                    Offline Mode
                </UBadge>
            </div>
            <div class="flex gap-2">
                <UPopover mode="click">
                    <UButton
                        icon="i-heroicons-arrow-down-tray"
                        color="neutral"
                        variant="soft"
                    >
                        Import/Export
                    </UButton>
                    <template #panel>
                        <div class="p-2">
                            <UButton
                                block
                                icon="i-heroicons-arrow-up-tray"
                                @click="exportPieces"
                            >
                                Export Pieces
                            </UButton>
                            <UButton
                                block
                                icon="i-heroicons-arrow-down-tray"
                                class="mt-2"
                                @click="fileInput?.click()"
                            >
                                Import Pieces
                            </UButton>
                        </div>
                    </template>
                </UPopover>
                <UButton
                    to="/stuecke/new"
                    icon="i-heroicons-plus"
                    color="primary"
                    class="font-medium"
                >
                    Neues Stück hinzufügen
                </UButton>
            </div>
        </div>

        <!-- Search and Filter Section -->
        <div class="mb-6 space-y-4">
            <div class="flex flex-col md:flex-row gap-4">
                <!-- Search Input -->
                <UInput
                    v-model="searchQuery"
                    icon="i-heroicons-magnifying-glass"
                    placeholder="Stücke suchen..."
                    class="flex-1"
                />

                <!-- Genre Filter -->
                <USelect
                    v-model="selectedGenre"
                    :options="genreOptions"
                    placeholder="Genre filtern"
                    class="w-full md:w-48"
                />

                <!-- Difficulty Filter -->
                <USelect
                    v-model="selectedDifficulty"
                    :options="difficultyOptions"
                    placeholder="Schwierigkeit filtern"
                    class="w-full md:w-48"
                />

                <!-- Sort Options -->
                <USelect
                    v-model="sortBy"
                    :options="sortOptions"
                    placeholder="Sortieren nach"
                    class="w-full md:w-48"
                />
            </div>

            <!-- Active Filters -->
            <div v-if="hasActiveFilters" class="flex flex-wrap gap-2">
                <UBadge
                    v-if="searchQuery"
                    color="primary"
                    variant="soft"
                    class="cursor-pointer"
                    @click="searchQuery = ''"
                >
                    Suche: {{ searchQuery }}
                    <UIcon name="i-heroicons-x-mark" class="ml-1" />
                </UBadge>
                <UBadge
                    v-if="selectedGenre"
                    color="primary"
                    variant="soft"
                    class="cursor-pointer"
                    @click="selectedGenre = ''"
                >
                    Genre: {{ getGenreLabel(selectedGenre) }}
                    <UIcon name="i-heroicons-x-mark" class="ml-1" />
                </UBadge>
                <UBadge
                    v-if="selectedDifficulty"
                    color="primary"
                    variant="soft"
                    class="cursor-pointer"
                    @click="selectedDifficulty = ''"
                >
                    Schwierigkeit: {{ getDifficultyLabel(selectedDifficulty) }}
                    <UIcon name="i-heroicons-x-mark" class="ml-1" />
                </UBadge>
                <UButton
                    v-if="hasActiveFilters"
                    color="neutral"
                    variant="soft"
                    size="xs"
                    @click="clearFilters"
                >
                    Alle Filter zurücksetzen
                </UButton>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <USkeleton v-for="n in 6" :key="n" class="h-48 rounded-lg" />
        </div>

        <!-- Error State -->
        <UAlert
            v-else-if="error"
            :title="typeof error === 'string' ? error : 'Ein Fehler ist aufgetreten'"
            color="error"
            variant="soft"
            icon="i-heroicons-exclamation-triangle"
            class="mb-4"
        >
            <template #description>
                <p>Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.</p>
            </template>
            <template #footer>
                <UButton
                    color="error"
                    variant="soft"
                    @click="handleRetry"
                >
                    Erneut versuchen
                </UButton>
            </template>
        </UAlert>

        <!-- Empty State -->
        <UCard
            v-else-if="filteredPieces.length === 0"
            class="text-center py-8"
        >
            <template #header>
                <UIcon name="i-heroicons-musical-note" class="text-4xl text-gray-400 mb-2" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {{ hasActiveFilters ? 'Keine Stücke gefunden' : 'Keine Stücke vorhanden' }}
                </h3>
            </template>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
                {{ hasActiveFilters 
                    ? 'Versuchen Sie es mit anderen Suchkriterien oder setzen Sie die Filter zurück.'
                    : 'Fügen Sie Ihr erstes Stück hinzu, um zu beginnen.' 
                }}
            </p>
            <div class="space-x-2">
                <UButton
                    v-if="hasActiveFilters"
                    color="neutral"
                    variant="soft"
                    @click="clearFilters"
                >
                    Filter zurücksetzen
                </UButton>
                <UButton
                    v-if="!hasActiveFilters"
                    to="/stuecke/new"
                    icon="i-heroicons-plus"
                    color="primary"
                    class="font-medium"
                >
                    Neues Stück hinzufügen
                </UButton>
            </div>
        </UCard>

        <!-- Content -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UCard
                v-for="piece in visiblePieces"
                :key="piece.stid"
                :to="`/stuecke/${piece.stid}`"
                class="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            >
                <template #header>
                    <div class="flex justify-between items-start">
                        <h3 class="text-lg font-semibold group-hover:text-primary-500 transition-colors">
                            {{ piece.name }}
                        </h3>
                        <UBadge 
                            :color="getDifficultyColor(piece.schwierigkeit || '')" 
                            variant="soft"
                        >
                            {{ getDifficultyLabel(piece.schwierigkeit || '') }}
                        </UBadge>
                    </div>
                </template>

                <div class="space-y-3">
                    <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <UIcon name="i-heroicons-musical-note" class="mr-2" />
                        {{ getGenreLabel(piece.genre || '') }}
                    </div>
                    
                    <div v-if="piece.arrangiert?.length" class="text-sm">
                        <span class="font-medium text-gray-700 dark:text-gray-300">Arrangiert von:</span>
                        <div class="mt-1 flex flex-wrap gap-2">
                            <UBadge
                                v-for="arranger in piece.arrangiert"
                                :key="arranger.pid"
                                color="neutral"
                                variant="soft"
                                class="group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors"
                            >
                                {{ [arranger.vorname, arranger.name].filter(Boolean).join(' ') }}
                            </UBadge>
                        </div>
                    </div>

                    <div v-if="piece.komponiert?.length" class="text-sm">
                        <span class="font-medium text-gray-700 dark:text-gray-300">Komponiert von:</span>
                        <div class="mt-1 flex flex-wrap gap-2">
                            <UBadge
                                v-for="composer in piece.komponiert"
                                :key="composer.pid"
                                color="neutral"
                                variant="soft"
                                class="group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors"
                            >
                                {{ [composer.vorname, composer.name].filter(Boolean).join(' ') }}
                            </UBadge>
                        </div>
                    </div>
                </div>
            </UCard>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMorePieces" class="mt-8 text-center">
            <UButton
                :loading="loadingMore"
                @click="loadMore"
                color="primary"
                variant="soft"
            >
                Mehr laden
            </UButton>
        </div>

        <!-- Hidden file input for import -->
        <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="handleFileImport"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from '#app';
import { usePieces } from '~/composables/usePieces';
import type { Piece } from '~/types/pieces';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, GENRE_LABELS } from '~/constants/pieces';

// Constants
const ITEMS_PER_PAGE = 12;

// State
const router = useRouter();
const fileInput = ref<HTMLInputElement | null>(null);
const { pieces, loading, error, fetchPieces, importPieces, exportPieces } = usePieces();
const isUsingDummyData = ref(false);
const currentPage = ref(1);
const loadingMore = ref(false);

// Search and Filter State
const searchQuery = ref('');
const selectedGenre = ref('');
const selectedDifficulty = ref('');
const sortBy = ref('name-asc');

// Computed
const genreOptions = computed(() => [
    { label: 'Alle Genres', value: '' },
    ...Object.entries(GENRE_LABELS).map(([value, label]) => ({
        label: label.de,
        value
    }))
]);

const difficultyOptions = computed(() => [
    { label: 'Alle Schwierigkeiten', value: '' },
    ...Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
        label: label.de,
        value
    }))
]);

const sortOptions = [
    { label: 'Name (A-Z)', value: 'name-asc' },
    { label: 'Name (Z-A)', value: 'name-desc' },
    { label: 'Schwierigkeit (leicht-schwer)', value: 'difficulty-asc' },
    { label: 'Schwierigkeit (schwer-leicht)', value: 'difficulty-desc' },
    { label: 'Genre (A-Z)', value: 'genre-asc' },
    { label: 'Genre (Z-A)', value: 'genre-desc' }
];

const hasActiveFilters = computed(() => {
    return searchQuery.value || selectedGenre.value || selectedDifficulty.value;
});

const filteredPieces = computed(() => {
    let result = [...pieces.value];

    // Apply search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(piece => 
            piece.name.toLowerCase().includes(query) ||
            piece.genre?.toLowerCase().includes(query) ||
            piece.arrangiert?.some(a => 
                [a.vorname, a.name].filter(Boolean).join(' ').toLowerCase().includes(query)
            ) ||
            piece.komponiert?.some(c => 
                [c.vorname, c.name].filter(Boolean).join(' ').toLowerCase().includes(query)
            )
        );
    }

    // Apply genre filter
    if (selectedGenre.value) {
        result = result.filter(piece => piece.genre === selectedGenre.value);
    }

    // Apply difficulty filter
    if (selectedDifficulty.value) {
        result = result.filter(piece => piece.schwierigkeit === selectedDifficulty.value);
    }

    // Apply sorting
    const [sortField, sortDirection] = sortBy.value.split('-');
    result.sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'difficulty':
                const difficultyOrder = ['very easy', 'easy', 'medium', 'hard', 'very hard'];
                const aIndex = difficultyOrder.indexOf(a.schwierigkeit || '');
                const bIndex = difficultyOrder.indexOf(b.schwierigkeit || '');
                comparison = aIndex - bIndex;
                break;
            case 'genre':
                comparison = (a.genre || '').localeCompare(b.genre || '');
                break;
        }

        return sortDirection === 'desc' ? -comparison : comparison;
    });

    return result;
});

const visiblePieces = computed(() => {
    return filteredPieces.value.slice(0, currentPage.value * ITEMS_PER_PAGE);
});

const hasMorePieces = computed(() => {
    return filteredPieces.value.length > currentPage.value * ITEMS_PER_PAGE;
});

// Methods
const loadMore = async () => {
    loadingMore.value = true;
    try {
        currentPage.value++;
        // Simulate loading delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
        loadingMore.value = false;
    }
};

const handleRetry = async () => {
    await fetchPieces();
};

const handleFileImport = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
        try {
            await importPieces(target.files[0]);
            target.value = ''; // Reset file input
            await fetchPieces(); // Refresh the list
        } catch (error) {
            console.error('Failed to import file:', error);
        }
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    selectedGenre.value = '';
    selectedDifficulty.value = '';
    sortBy.value = 'name-asc';
    currentPage.value = 1;
};

// Helper function to get color based on difficulty
const getDifficultyColor = (difficulty: string) => {
    const normalizedDifficulty = normalizeDifficulty(difficulty);
    return DIFFICULTY_COLORS[normalizedDifficulty as keyof typeof DIFFICULTY_COLORS] || 'neutral';
};

// Helper function to get label based on difficulty
const getDifficultyLabel = (difficulty: string) => {
    const normalizedDifficulty = normalizeDifficulty(difficulty);
    return DIFFICULTY_LABELS[normalizedDifficulty as keyof typeof DIFFICULTY_LABELS]?.de || difficulty;
};

// Helper function to get label based on genre
const getGenreLabel = (genre: string) => {
    return GENRE_LABELS[genre as keyof typeof GENRE_LABELS]?.de || genre;
};

// Helper function to normalize difficulty values
const normalizeDifficulty = (difficulty: string) => {
    const normalized = difficulty.toLowerCase().trim();
    return normalized;
};

// Lifecycle
onMounted(async () => {
    await fetchPieces();
});
</script>

<style scoped>
.container {
    max-width: 1200px;
}

/* Add smooth transitions for hover effects */
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}

/* Optimize paint and composite operations */
.hover\:shadow-lg {
    will-change: transform, box-shadow;
}

/* Optimize text rendering */
.text-lg, .text-2xl {
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
}

/* Optimize animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.fade-in {
    animation: fadeIn 0.3s ease-in-out;
}
</style>
