<template>
    <div class="piece-details-container">
        <div class="piece-details-wrapper">
            <UButton
                icon="i-heroicons-arrow-left"
                @click="goBack"
                class="back-button"
            >
                Go Back
            </UButton>

            <h1 class="piece-title">
                {{ piece.name || "Piece Not Found" }}
            </h1>

            <p v-if="piece.description" class="piece-description">
                {{ piece.description }}
            </p>
            <p v-else class="piece-description">
                This piece does not exist or is not available yet.
            </p>

            <UCard class="piece-info-card">
                <template #header>
                    <div class="card-header-wrapper">
                        <h2 class="card-header-title">
                            <UIcon
                                name="i-heroicons-information-circle"
                                class="mr-2"
                            />
                            Piece Information
                        </h2>
                    </div>
                </template>

                <template #default>
                    <div class="piece-info-body">
                        <div class="piece-image-container">
                            <NuxtImg
                                :src="
                                    (piece as any).imageUrl ||
                                    '/assets/img/default-piece.jpg'
                                "
                                alt="Piece Image"
                                class="piece-image"
                                width="160"
                                height="160"
                            />
                        </div>
                        <div class="piece-details">
                            <div class="info-item">
                                <div class="info-label">
                                    <UIcon
                                        name="i-heroicons-calendar"
                                        class="info-icon"
                                    />
                                    <span>Year</span>
                                </div>
                                <div class="info-value">
                                    {{ (piece as any).year || "Unknown" }}
                                </div>
                            </div>

                            <div class="info-item">
                                <div class="info-label">
                                    <UIcon
                                        name="i-heroicons-musical-note"
                                        class="info-icon"
                                    />
                                    <span>Composer</span>
                                </div>
                                <div class="info-value">
                                    {{
                                        (piece as any).komponiert
                                            ?.map(
                                                (composer: {
                                                    vorname: string;
                                                    name: string;
                                                }) =>
                                                    `${composer.vorname} ${composer.name}`,
                                            )
                                            .join(", ") || "Unknown"
                                    }}
                                </div>
                            </div>

                            <div class="info-item">
                                <div class="info-label">
                                    <UIcon
                                        name="i-heroicons-pencil"
                                        class="info-icon"
                                    />
                                    <span>Arranger</span>
                                </div>
                                <div class="info-value">
                                    {{
                                        (piece as any).arrangiert
                                            ?.map(
                                                (arranger: {
                                                    vorname: string;
                                                    name: string;
                                                }) =>
                                                    `${arranger.vorname} ${arranger.name}`,
                                            )
                                            .join(", ") || "None"
                                    }}
                                </div>
                            </div>

                            <div class="info-item">
                                <div class="info-label">
                                    <UIcon
                                        name="i-heroicons-star"
                                        class="info-icon"
                                    />
                                    <span>Difficulty</span>
                                </div>
                                <div class="info-value">
                                    <DifficultyIndicator
                                        :level="
                                            (piece as any).difficulty ||
                                            'unknown'
                                        "
                                        :difficulty="
                                            (piece as any).difficulty ||
                                            'unknown'
                                        "
                                    />
                                </div>
                            </div>

                            <div class="info-item">
                                <div class="info-label">
                                    <UIcon
                                        name="i-heroicons-document"
                                        class="info-icon"
                                    />
                                    <span>Digitized</span>
                                </div>
                                <div class="info-value">
                                    <DigitizedIndicator
                                        :isDigitized="
                                            Boolean(
                                                (piece as any).digitized ??
                                                    false,
                                            )
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </UCard>

            <div class="timeline-section">
                <Timeline :events="timelineEvents as any" />
            </div>

            <div v-if="piece.name" class="piece-actions">
                <UCard class="action-card youtube-card">
                    <template #header>
                        <h2 class="card-header-title">🎥 Find on YouTube</h2>
                    </template>
                    <template #default>
                        <p class="action-description">
                            Search for performances of this piece on YouTube.
                        </p>
                        <UButton
                            :href="youtubeSearchUrl"
                            target="_blank"
                            color="primary"
                            class="action-button"
                        >
                            Search on YouTube
                        </UButton>
                    </template>
                </UCard>

                <UCard
                    v-if="
                        ['Klassik', 'Barock', 'Romantik'].includes(
                            piece.genre?.toLowerCase(),
                        )
                    "
                    class="action-card imslp-card"
                >
                    <template #header>
                        <h2 class="card-header-title">🎼 Find on IMSLP</h2>
                    </template>
                    <template #default>
                        <p class="action-description">
                            Search for sheet music of this piece on IMSLP.
                        </p>
                        <UButton
                            :href="imslpSearchUrl"
                            target="_blank"
                            color="primary"
                            class="action-button"
                        >
                            Search on IMSLP
                        </UButton>
                    </template>
                </UCard>

                <UCard class="action-card sheet-music-card">
                    <template #header>
                        <h2 class="card-header-title">📄 Sheet Music</h2>
                    </template>
                    <template #default>
                        <p class="action-description">
                            Upload or download sheet music for this piece.
                        </p>
                        <div class="flex space-x-4">
                            <UButton
                                label="Upload"
                                color="primary"
                                @click="uploadSheetMusic"
                                class="action-button"
                            >
                                Upload
                            </UButton>
                            <UButton
                                v-if="piece.sheetMusicUrl"
                                :href="piece.sheetMusicUrl"
                                download
                                color="primary"
                                :label="'Download'"
                                class="action-button"
                            />
                        </div>
                    </template>
                </UCard>

                <UCard class="action-card info-card">
                    <template #header>
                        <h2 class="card-header-title">
                            ℹ️ Additional Information
                        </h2>
                    </template>
                    <template #default>
                        <p class="action-description">
                            Explore more about this piece, including its history
                            and composer.
                        </p>
                        <UButton
                            color="primary"
                            @click="showAdditionalInfo"
                            class="action-button"
                        >
                            Learn More
                        </UButton>
                    </template>
                </UCard>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "#app";
import { useMusicData } from "~/composables/useMusicData";
import DifficultyIndicator from "~/components/MusicTable/DifficultyIndicator.vue";
import DigitizedIndicator from "~/components/MusicTable/DigitizedIndicator.vue";
import Timeline from "~/components/Timeline.vue";

const route = useRoute();
const router = useRouter();

// Adjusted to directly use the ID from route parameters
const pieceId = ref(String(route.params.id));

const piece = ref({
    name: "",
    description: "",
    sheetMusicUrl: "",
    genre: "",
});

const youtubeSearchUrl = ref("");
const imslpSearchUrl = ref("");
const timelineEvents = ref([
    {
        date: "2023-01-15",
        title: "Arranged",
        description: "This piece was arranged by John Doe.",
        link: null,
        icon: "mdi-pencil",
        iconColor: "#10b981",
    },
    {
        date: "2023-03-10",
        title: "Last Played",
        description: "Performed at the Spring Concert.",
        link: "https://example.com/concert",
        icon: "mdi-music",
        iconColor: "#3b82f6",
    },
    {
        date: "2023-05-05",
        title: "Bought",
        description: "Purchased by the orchestra.",
        link: null,
        icon: "mdi-cart",
        iconColor: "#f59e0b",
    },
]);

const { fetchPieceById } = useMusicData();

async function fetchPieceDetails() {
    try {
        const foundPiece = await fetchPieceById(pieceId.value);

        if (foundPiece) {
            piece.value = foundPiece;
            const arrangerName =
                foundPiece.arrangiert
                    ?.map(
                        (arranger: { vorname: string; name: string }) =>
                            `${arranger.vorname} ${arranger.name}`,
                    )
                    .join(" ") || "";
            const searchQuery = `${encodeURIComponent(foundPiece.name)}+intitle:${encodeURIComponent(arrangerName)}+orchestra`;
            youtubeSearchUrl.value = `https://www.youtube.com/results?search_query=${searchQuery}`;

            const composerNames =
                foundPiece.komponiert
                    ?.map(
                        (composer: { vorname: string; name: string }) =>
                            `${composer.vorname} ${composer.name}`,
                    )
                    .join(" ") || "";
            const imslpQuery = `${encodeURIComponent(foundPiece.name)}+intitle:${encodeURIComponent(composerNames)}`;
            imslpSearchUrl.value = `https://imslp.org/wiki/Special:Search?search=${imslpQuery}`;
        } else {
            piece.value = {
                name: "",
                description:
                    "This piece does not exist or is not available yet.",
                sheetMusicUrl: "",
                genre: "",
            };
        }
    } catch (error) {
        console.error("Failed to fetch piece details:", error);
        // Optionally, display an error message to the user
    }
}

function uploadSheetMusic(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
        alert(`Uploading ${file.name}...`);
        // Implement upload logic here (e.g., using a service to upload the file)
    }
}

function goBack() {
    router.back();
}

function showAdditionalInfo() {
    alert("Additional information about this piece will be available soon!");
}

onMounted(() => {
    fetchPieceDetails();
});

// Watch for changes in the route params and refetch the piece details
watch(
    () => route.params.id,
    (newId) => {
        pieceId.value = String(newId);
        fetchPieceDetails();
    },
);
</script>

<style scoped>
.piece-details-container {
    container: mx-auto;
    padding: 2rem 0;
}
.piece-details-wrapper {
    background-color: var(--color-surface);
    border-radius: 0.75rem;
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}
.back-button {
    margin-bottom: 1.5rem;
    color: var(--color-primary);
    transition: all 0.3s ease;
}
.back-button:hover {
    transform: translateX(-5px);
}
.piece-title {
    font-size: 2.25rem;
    line-height: 2.5rem;
    font-weight: 700;
    margin-bottom: 1.25rem;
    text-align: center;
    color: var(--color-text);
    border-bottom: 2px solid var(--color-primary);
    padding-bottom: 0.75rem;
}
.piece-description {
    font-size: 1.125rem;
    line-height: 1.75rem;
    color: var(--color-muted-text);
    margin-bottom: 2rem;
    text-align: center;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
}
.piece-info-card {
    margin-bottom: 2rem;
    border: 1px solid var(--color-border);
    background-color: var(--color-surface);
    border-radius: 1rem;
    overflow: hidden;
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.08),
        0 4px 6px -2px rgba(0, 0, 0, 0.04);
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}
.piece-info-card:hover {
    transform: translateY(-5px);
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.card-header-wrapper {
    padding: 1rem;
    border-bottom: 3px solid var(--color-primary);
    background-color: rgba(59, 130, 246, 0.05);
}
.card-header-title {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 600;
    color: var(--color-primary);
}
.piece-info-body {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem;
}
@media (min-width: 640px) {
    .piece-info-body {
        flex-direction: row;
        align-items: flex-start;
    }
}
.piece-image-container {
    flex-shrink: 0;
    display: flex;
    justify-content: center;
}
.piece-image {
    width: 10rem;
    height: 10rem;
    border-radius: 1rem;
    object-fit: cover;
    box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 4px solid var(--color-primary);
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}
.piece-image:hover {
    transform: scale(1.05);
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.piece-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}
.info-item {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 1rem;
    transition: all 0.3s ease;
}
.info-item:hover {
    border-bottom-color: var(--color-primary);
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 0.5rem;
    padding-left: 0.5rem;
}
@media (min-width: 768px) {
    .info-item {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }
}
.info-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    color: var(--color-muted-text);
    min-width: 10rem;
}
.info-icon {
    color: var(--color-primary);
    font-size: 1.25rem;
}
.info-value {
    color: var(--color-text);
    flex: 1;
    margin-top: 0.25rem;
    font-weight: 500;
}
@media (min-width: 768px) {
    .info-value {
        margin-top: 0;
        text-align: right;
    }
}
.timeline-section {
    margin: 3rem 0;
    padding: 1.5rem;
    background-color: rgba(59, 130, 246, 0.05);
    border-radius: 1rem;
    border: 1px solid var(--color-border);
}
.piece-actions {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 2rem;
}
@media (min-width: 768px) {
    .piece-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
.action-card {
    background-color: var(--color-surface);
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid var(--color-border);
    transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;
}
.action-card:hover {
    transform: translateY(-5px);
    box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
.youtube-card:hover {
    border-top: 3px solid var(--color-error);
}
.imslp-card:hover {
    border-top: 3px solid var(--color-info);
}
.sheet-music-card:hover {
    border-top: 3px solid var(--color-success);
}
.info-card:hover {
    border-top: 3px solid var(--color-accent);
}
.action-description {
    color: var(--color-muted-text);
    margin-bottom: 1.5rem;
    line-height: 1.6;
}
.action-button {
    font-weight: 600;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s ease;
}
.action-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);
}
</style>
