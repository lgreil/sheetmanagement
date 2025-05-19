<!-- pages/music-collection.vue -->
<template>
    <UContainer class="py-10">
        <div class="max-w-5xl mx-auto">
            <div class="flex items-center justify-between mb-8">
                <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Stücke
                </h1>
                <div class="flex gap-2">
                    <UButton
                        icon="i-heroicons-plus"
                        @click="navigateToNewPiece"
                    >
                        Add Piece
                    </UButton>
                    <UDropdown :items="exportImportItems">
                        <UButton
                            icon="i-heroicons-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                        />
                    </UDropdown>
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".json"
                        class="hidden"
                        @change="handleFileImport"
                    >
                </div>
            </div>

            <!-- Pieces List -->
            <div class="grid gap-4">
                <UCard v-for="piece in pieces" :key="piece.stid" class="p-4">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="text-xl font-semibold">{{ piece.name }}</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                {{ piece.komponiert[0]?.name || 'Unknown' }}
                                <span v-if="piece.jahr">({{ piece.jahr }})</span>
                            </p>
                            <div class="mt-2 flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <span v-if="piece.schwierigkeit">
                                    <UIcon name="i-heroicons-star" class="mr-1" />
                                    Difficulty: {{ piece.schwierigkeit }}
                                </span>
                                <span v-if="piece.genre">
                                    <UIcon name="i-heroicons-musical-note" class="mr-1" />
                                    {{ piece.genre }}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <UButton
                                icon="i-heroicons-pencil"
                                color="neutral"
                                variant="ghost"
                                @click="navigateToPieceOverview(piece.stid)"
                            />
                        </div>
                    </div>

                    <!-- Arrangements Section -->
                    <div v-if="piece.arrangiert && piece.arrangiert.length > 0" class="mt-4 border-t pt-4">
                        <h4 class="text-sm font-semibold mb-2">Arrangements</h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                            <div
                                v-for="arrangement in piece.arrangiert"
                                :key="arrangement.pid"
                                class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                            >
                                <UIcon name="i-heroicons-document" />
                                <div class="flex-1">
                                    <div class="text-sm font-medium">
                                        {{ [arrangement.vorname, arrangement.name].filter(Boolean).join(' ') }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </UCard>
            </div>

            <UAlert
                v-if="error"
                class="mt-4"
                color="error"
                variant="soft"
                title="Error"
            >
                Failed to load music collection: {{ error.message }}
            </UAlert>
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '#app';
import { useMusicData } from '~/composables/useMusicData';

const router = useRouter();
const fileInput = ref<HTMLInputElement | null>(null);
const { pieces, loading, error, fetchPieces } = useMusicData();

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

const exportImportItems = [
    {
        label: 'Export Pieces',
        icon: 'i-heroicons-arrow-up-tray',
        click: () => exportPieces()
    },
    {
        label: 'Import Pieces',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => fileInput.value?.click()
    }
];

const handleFileImport = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
        try {
            const formData = new FormData();
            formData.append('file', target.files[0]);
            await fetch('/api/pieces/import', {
                method: 'POST',
                body: formData
            });
            target.value = ''; // Reset file input
            await fetchPieces(); // Refresh the list
        } catch (error) {
            console.error('Failed to import file:', error);
        }
    }
};

const exportPieces = async () => {
    try {
        const response = await fetch('/api/pieces/export');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pieces.json';
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to export pieces:', error);
    }
};
</script>
