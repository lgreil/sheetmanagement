<template>
    <div class="container mx-auto py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h1 class="text-3xl font-bold mb-4 text-center text-[--dark-color] dark:text-white">{{ piece.name || 'Piece Not Found' }}</h1>
            <p v-if="piece.description" class="text-lg text-gray-600 dark:text-gray-300 mb-6 text-center">{{ piece.description }}</p>
            <p v-else class="text-lg text-gray-600 dark:text-gray-300 mb-6 text-center">This piece does not exist or is not available yet.</p>

            <div v-if="piece.name" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- YouTube Search -->
                <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                    <h2 class="text-xl font-semibold mb-2 text-[--dark-color] dark:text-white">🎥 Find on YouTube</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">Search for performances of this piece on YouTube.</p>
                    <a :href="youtubeSearchUrl" target="_blank"
                        class="inline-block px-4 py-2 bg-[--dark-color] dark:bg-gray-600 text-white rounded-lg shadow hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-500 transition">
                        Search on YouTube
                    </a>
                </div>

                <!-- Upload/Download Sheet Music -->
                <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                    <h2 class="text-xl font-semibold mb-2 text-[--dark-color] dark:text-white">📄 Sheet Music</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">Upload or download sheet music for this piece.</p>
                    <div class="flex space-x-4">
                        <label class="cursor-pointer inline-block px-4 py-2 bg-[--dark-color] dark:bg-gray-600 text-white rounded-lg shadow hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-500 transition">
                            Upload
                            <input type="file" class="hidden" @change="uploadSheetMusic" />
                        </label>
                        <a v-if="piece.sheetMusicUrl" :href="piece.sheetMusicUrl" download
                            class="inline-block px-4 py-2 bg-[--dark-color] dark:bg-gray-600 text-white rounded-lg shadow hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-500 transition">
                            Download
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from '#app';

const route = useRoute();
const pieceId = route.params.id;
const piece = ref({
    name: '',
    description: '',
    sheetMusicUrl: '',
});

const youtubeSearchUrl = ref('');

async function fetchPieceDetails() {
    // Simulate fetching piece details from an API
    if (pieceId === 'dummy') {
        piece.value = {
            name: '',
            description: '',
            sheetMusicUrl: '',
        };
    } else {
        piece.value = {
            name: `Piece ${pieceId}`,
            description: 'A beautiful composition that resonates with the soul.',
            sheetMusicUrl: '', // Add a URL if available
        };
        youtubeSearchUrl.value = `https://www.youtube.com/results?search_query=${encodeURIComponent(piece.value.name)}`;
    }
}

function uploadSheetMusic(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        alert(`Uploading ${file.name}...`);
        // Implement upload logic here
    }
}

onMounted(() => {
    fetchPieceDetails();
});
</script>

<style>
.container {
    max-width: 800px;
}
</style>