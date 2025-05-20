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
            v-else-if="pieces.length === 0"
            class="text-center py-8"
        >
            <template #header>
                <UIcon name="i-heroicons-musical-note" class="text-4xl text-gray-400 mb-2" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Keine Stücke gefunden</h3>
            </template>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
                Fügen Sie Ihr erstes Stück hinzu, um zu beginnen.
            </p>
            <UButton
                to="/stuecke/new"
                icon="i-heroicons-plus"
                color="primary"
                class="font-medium"
            >
                Neues Stück hinzufügen
            </UButton>
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

// Computed
const visiblePieces = computed(() => {
    return pieces.value.slice(0, currentPage.value * ITEMS_PER_PAGE);
});

const hasMorePieces = computed(() => {
    return pieces.value.length > currentPage.value * ITEMS_PER_PAGE;
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
    const normalizedGenre = normalizeGenre(genre);
    return GENRE_LABELS[normalizedGenre as keyof typeof GENRE_LABELS]?.de || genre;
};

// Helper function to normalize difficulty values
const normalizeDifficulty = (difficulty: string): string => {
    const difficultyMap: Record<string, string> = {
        'very easy': 'very_easy',
        'leicht': 'easy',
        'sehr leicht': 'very_easy',
        'mittel': 'medium',
        'schwer': 'hard',
        'sehr schwer': 'very_hard',
        'very hard': 'very_hard',
        'test': 'medium'
    };
    return difficultyMap[difficulty.toLowerCase()] || difficulty;
};

// Helper function to normalize genre values
const normalizeGenre = (genre: string): string => {
    const genreMap: Record<string, string> = {
        'klassik': 'classical',
        'barock': 'baroque',
        'modern': 'modern',
        'pop / rock / modern': 'pop_rock',
        'filmmusik': 'film_music',
        'musical': 'musical',
        'musicals': 'musical'
    };
    return genreMap[genre.toLowerCase()] || genre;
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
