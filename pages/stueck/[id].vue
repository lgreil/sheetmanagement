<template>
    <div class="container mx-auto py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <button @click="goBack" class="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition">
                ← Go Back
            </button>
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

                <!-- IMSLP Search -->
                <div v-if="['Klassik', 'Barock', 'Romantik'].includes(piece.genre?.toLowerCase())" class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                    <h2 class="text-xl font-semibold mb-2 text-[--dark-color] dark:text-white">🎼 Find on IMSLP</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">Search for sheet music of this piece on IMSLP.</p>
                    <a :href="imslpSearchUrl" target="_blank"
                        class="inline-block px-4 py-2 bg-[--dark-color] dark:bg-gray-600 text-white rounded-lg shadow hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-500 transition">
                        Search on IMSLP
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

                <!-- Additional Info -->
                <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow">
                    <h2 class="text-xl font-semibold mb-2 text-[--dark-color] dark:text-white">ℹ️ Additional Information</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">Explore more about this piece, including its history and composer.</p>
                    <button @click="showAdditionalInfo"
                        class="inline-block px-4 py-2 bg-[--dark-color] dark:bg-gray-600 text-white rounded-lg shadow hover:bg-[--bachkreisgelb-dunkel] dark:hover:bg-gray-500 transition">
                        Learn More
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from '#app';
import { useMusicData } from "~/composables/useMusicData";

const route = useRoute();
const router = useRouter();
const pieceId = ref((parseInt(route.params.id as string) + 1).toString()); // Adjusted to increment the ID by 1
console.log("Initial pieceId from route:", pieceId.value); // Debugging log

const piece = ref({
    name: '',
    description: '',
    sheetMusicUrl: '',
    genre: '', // Added genre property
});

const youtubeSearchUrl = ref('');
const imslpSearchUrl = ref('');

const { fetchPieceById } = useMusicData();

async function fetchPieceDetails() {
    console.log("Fetching details for pieceId:", pieceId.value); // Debugging log
    const foundPiece = await fetchPieceById(pieceId.value);

    if (foundPiece) {
        piece.value = foundPiece;
        const arrangerName = piece.value.arrangiert?.map(arranger => `${arranger.vorname} ${arranger.name}`).join(' ') || '';
        const searchQuery = `${encodeURIComponent(piece.value.name)}+intitle:${encodeURIComponent(arrangerName)}+orchestra`;
        youtubeSearchUrl.value = `https://www.youtube.com/results?search_query=${searchQuery}`;

        const composerName = piece.value.composer ? `${piece.value.composer.vorname} ${piece.value.composer.name}` : '';
        const imslpQuery = `${encodeURIComponent(piece.value.name)}+intitle:${encodeURIComponent(composerName)}`;
        imslpSearchUrl.value = `https://imslp.org/wiki/Special:Search?search=${imslpQuery}`;
    } else {
        piece.value = {
            name: '',
            description: 'This piece does not exist or is not available yet.',
            sheetMusicUrl: '',
        };
    }
}

function uploadSheetMusic(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        alert(`Uploading ${file.name}...`);
        // Implement upload logic here
    }
}

function goBack() {
    router.back();
}

function showAdditionalInfo() {
    alert('Additional information about this piece will be available soon!');
}

onMounted(() => {
    fetchPieceDetails();
});

// Watch for changes in the route params and refetch the piece details
watch(() => route.params.id, (newId) => {
    console.log("Route param id changed to:", newId); // Debugging log
    pieceId.value = (parseInt(newId as string)).toString(); // Adjusted to increment the ID by 1
    fetchPieceDetails();
});
</script>

<style>
.container {
    max-width: 800px;
}
</style>