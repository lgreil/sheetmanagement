<template>
    <div class="container mx-auto px-4 py-8">
        <div v-if="loading" class="flex justify-center items-center py-8">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
        </div>

        <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-4 rounded-lg">
            {{ error }}
        </div>

        <div v-else-if="!piece" class="text-center py-8 text-gray-500 dark:text-gray-400">
            Stück nicht gefunden
        </div>

        <div v-else class="max-w-4xl mx-auto">
            <div class="flex justify-between items-start mb-6">
                <div>
                    <h1 class="text-3xl font-bold mb-2">{{ piece.name }}</h1>
                    <div class="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                        <div class="flex items-center">
                            <UIcon name="i-heroicons-musical-note" class="mr-2" />
                            {{ getGenreLabel(piece.genre || '') }}
                        </div>
                        <UBadge 
                            :color="getDifficultyColor(piece.schwierigkeit || '')" 
                            variant="soft"
                        >
                            {{ getDifficultyLabel(piece.schwierigkeit || '') }}
                        </UBadge>
                    </div>
                </div>
                <div class="flex gap-2">
                    <UButton
                        icon="i-heroicons-pencil"
                        color="primary"
                        variant="soft"
                        :to="`/stuecke/${piece.stid}/edit`"
                    >
                        Bearbeiten
                    </UButton>
                    <UButton
                        icon="i-heroicons-arrow-left"
                        color="neutral"
                        variant="soft"
                        to="/stuecke"
                    >
                        Zurück
                    </UButton>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left column: Piece details -->
                <div class="lg:col-span-1 space-y-6">
                    <div v-if="piece.komponiert?.length" class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <h2 class="text-lg font-semibold mb-3">Komponiert von</h2>
                        <div class="flex flex-wrap gap-2">
                            <UBadge
                                v-for="composer in piece.komponiert"
                                :key="composer.pid"
                                color="primary"
                                variant="soft"
                            >
                                {{ [composer.vorname, composer.name].filter(Boolean).join(' ') }}
                            </UBadge>
                        </div>
                    </div>

                    <div v-if="piece.arrangiert?.length" class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <h2 class="text-lg font-semibold mb-3">Arrangiert von</h2>
                        <div class="flex flex-wrap gap-2">
                            <UBadge
                                v-for="arranger in piece.arrangiert"
                                :key="arranger.pid"
                                color="primary"
                                variant="soft"
                            >
                                {{ [arranger.vorname, arranger.name].filter(Boolean).join(' ') }}
                            </UBadge>
                        </div>
                    </div>
                </div>

                <!-- Right column: Timeline -->
                <div class="lg:col-span-2">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                        <h2 class="text-lg font-semibold mb-4">Timeline</h2>
                        <div class="space-y-4">
                            <div v-if="timeline.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
                                Keine Ereignisse gefunden
                            </div>
                            <div v-else class="relative">
                                <!-- Timeline line -->
                                <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                
                                <!-- Timeline events -->
                                <div v-for="(event, index) in timeline" :key="index" class="relative pl-10 pb-6">
                                    <!-- Event dot -->
                                    <div class="absolute left-3 w-3 h-3 rounded-full bg-primary-500"></div>
                                    
                                    <!-- Event content -->
                                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <div class="flex items-center justify-between mb-2">
                                            <h3 class="font-semibold">{{ event.title }}</h3>
                                            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(event.date) }}</span>
                                        </div>
                                        <p class="text-gray-600 dark:text-gray-300">{{ event.description }}</p>
                                        <div v-if="event.metadata" class="mt-2 flex flex-wrap gap-2">
                                            <UBadge
                                                v-for="(value, key) in event.metadata"
                                                :key="key"
                                                color="neutral"
                                                variant="soft"
                                            >
                                                {{ key }}: {{ value }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Piece } from '~/types/pieces';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, GENRE_LABELS } from '~/constants/pieces';

const route = useRoute();
const pieceId = Number(route.params.id);

const { pieces, loading, error, fetchPieceById } = usePieces();
const piece = ref<Piece | null>(null);

// Mock timeline data - replace with actual data from your backend
const timeline = ref([
    {
        date: '2024-03-15',
        title: 'Konzert in der Stadthalle',
        description: 'Aufführung im Rahmen des Frühlingskonzerts',
        metadata: {
            'Ort': 'Stadthalle',
            'Dirigent': 'Max Mustermann'
        }
    },
    {
        date: '2024-02-01',
        title: 'Neuerwerbung',
        description: 'Stück wurde in die Bibliothek aufgenommen',
        metadata: {
            'Preis': '€45,00',
            'Lieferant': 'Musikverlag XYZ'
        }
    },
    {
        date: '2024-01-15',
        title: 'Probe',
        description: 'Erste Probe mit dem Orchester',
        metadata: {
            'Dirigent': 'Max Mustermann',
            'Dauer': '2 Stunden'
        }
    }
]);

// Fetch piece when component is mounted
onMounted(async () => {
    try {
        piece.value = await fetchPieceById(pieceId);
    } catch (e) {
        console.error('Error loading piece:', e);
    }
});

// Watch for route changes to update the piece
watch(() => route.params.id, async (newId) => {
    if (newId) {
        try {
            piece.value = await fetchPieceById(Number(newId));
        } catch (e) {
            console.error('Error loading piece:', e);
        }
    }
});

// Helper function to format dates
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
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
</script>

<style scoped>
.container {
    max-width: 1200px;
}
</style>
