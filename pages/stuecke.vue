<!-- pages/music-collection.vue -->
<template>
    <div class="container mx-auto py-8">
        <h1 class="text-2xl font-bold mb-6 text-center">Music Collection</h1>
        <MusicTableContainer
            :pieces="pieces"
            :loading="loading"
            @update:loading="loading = $event"
            @piece-click="navigateToPieceOverview"
        />
        <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
            Failed to load music collection: {{ error.message }}
        </div>
    </div>
</template>

<script setup lang="ts">
import MusicTableContainer from "~/components/MusicTable/MusicTableContainer.vue";
import { useMusicData } from "~/composables/useMusicData";
import { ref } from "vue";
import { useRouter } from "#app";

// Create refs for pagination to pass to composable
const pageIndex = ref(0);
const pageSize = ref(10);

// Pass pageIndex and pageSize to the composable
const { pieces, loading, error } = useMusicData(
    pageIndex.value,
    pageSize.value,
);

// Router instance for navigation
const router = useRouter();

// Navigate to piece overview page
function navigateToPieceOverview(pieceId: string) {
    router.push(`/stuecke/${pieceId}`);
}
</script>
