<!-- pages/music-collection.vue -->
<template>
    <div class="container mx-auto py-8">
        <h1 class="text-2xl font-bold mb-6 text-center">Music Collection</h1>
        
        <Suspense>
            <template #default>
                <MusicTableContainer
                    :pieces="pieces"
                    :loading="loading"
                    @update:loading="loading = $event"
                    @piece-click="piece => navigateToPieceOverview(piece.stid)"
                />
            </template>
            <template #fallback>
                <MusicTableSkeleton />
            </template>
        </Suspense>

        <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
            Failed to load music collection: {{ error.message }}
        </div>
    </div>
</template>

<script setup lang="ts">
import MusicTableContainer from "~/components/MusicTable/MusicTableContainer.vue";
import MusicTableSkeleton from "~/components/MusicTable/MusicTableSkeleton.vue";
import { useMusicData } from "~/composables/useMusicData";
import { useRouter } from "#app";

const router = useRouter();
const { pieces, loading, error, fetchPieces } = useMusicData();

// Initialize data loading
onMounted(async () => {
    try {
        await fetchPieces();
    } catch (err) {
        console.error('Failed to load initial data:', err);
    }
});

const navigateToPieceOverview = (pieceId: number) => {
    router.push(`/stueck/${pieceId}`);
};
</script>
