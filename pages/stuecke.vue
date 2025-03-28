<!-- pages/music-collection.vue -->
<template>
    <UContainer
        class="py-8"
        :class="{
            'bg-surface text-text': true,
        }"
    >
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-center flex-grow">
                Music Collection
            </h1>
            <UButton
                color="primary"
                icon="i-heroicons-plus"
                @click="navigateToNewPiece"
            >
                Add New Piece
            </UButton>
        </div>
        <UAlert
            color="error"
            variant="soft"
            title="Error - Still being implemented"
        >
            Still being implemented
        </UAlert>
        <Suspense>
            <template #default>
                <MusicTableContainer
                    :pieces="pieces"
                    :loading="loading"
                    @update:loading="loading = $event"
                    @piece-click="
                        (piece) => navigateToPieceOverview(piece.stid)
                    "
                />
            </template>
            <template #fallback>
                <MusicTableSkeleton />
            </template>
        </Suspense>

        <UAlert
            v-if="error"
            class="mt-4"
            color="error"
            variant="soft"
            title="Error"
        >
            Failed to load music collection: {{ error.message }}
        </UAlert>
    </UContainer>
</template>

<script setup lang="ts">
import MusicTableContainer from "~/components/MusicTable/MusicTableContainer.vue";
import MusicTableSkeleton from "~/components/MusicTable/MusicTableSkeleton.vue";
import { useMusicData } from "~/composables/useMusicData";
import { useRouter } from "#app";

const router = useRouter();
const { pieces, loading, error, fetchPieces } = useMusicData();

// Use the dummy pieces from content/dummyMusicData.json instead of real data for testing purposes
// Make sure they fit my piece type defintion

let dummyPieces = [
    {
        stid: 1,
        name: "Dummy Piece",
        genre: "Classical",
        jahr: 2023,
        schwierigkeit: "Easy",
        isdigitalisiert: true,
        arrangiert: [{ id: 1, vorname: "John", name: "Doe" }],
        komponiert: [{ id: 2, vorname: "Jane", name: "Smith" }],
    },
    {
        stid: 2,
        name: "Another Dummy Piece",
        genre: "Classical",
        jahr: 2023,
        schwierigkeit: "Easy",
        isdigitalisiert: true,
        arrangiert: [],
        komponiert: [],
    },
];
// Override the pieces ref with dummy data
// Force the type with 'as' to prevent type errors
// This is a temporary solution while developing with dummy data
pieces.value = dummyPieces as any;

// Initialize data loading
//onMounted(async () => {
//    try {
//        await fetchPieces();
//    } catch (err) {
//        console.error("Failed to load initial data:", err);
//    }
//});

const navigateToPieceOverview = (pieceId: number) => {
    router.push(`/stueck/${pieceId}`);
};

const navigateToNewPiece = () => {
    router.push("/stueck/new");
};
</script>
