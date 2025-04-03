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
        <ClientOnly>
            <Suspense>
                <template #default>
                    <MusicTableContainer
                        :pieces="pieces"
                        :loading="loading"
                        :total-items="totalItems"
                        :page-size="pageSize"
                        :page-index="pageIndex"
                        @update:loading="loading = $event"
                        @update:page-size="pageSize = $event"
                        @update:page-index="pageIndex = $event"
                        @piece-click="(piece) => navigateToPieceOverview(piece.stid)"
                    />
                </template>
                <template #fallback>
                    <MusicTableSkeleton />
                </template>
            </Suspense>
        </ClientOnly>


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
import { onMounted } from "vue";

const router = useRouter();
const { pieces, loading, error, fetchPieces, totalItems, pageSize, pageIndex } = useMusicData();

// Initialize data loading
onMounted(async () => {
    try {
        await fetchPieces();
    } catch (err) {
        console.error("Failed to load initial data:", err);
    }
});

const navigateToPieceOverview = (pieceId: number) => {
    router.push(`/stueck/${pieceId}`);
};

const navigateToNewPiece = () => {
    router.push("/stueck/new");
};
</script>
