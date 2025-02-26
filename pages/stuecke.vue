/* pages/music-collection.vue */
<template>
    <div class="container mx-auto py-8">
        <h1 class="text-2xl font-bold mb-6">Music Collection</h1>

        <MusicTableContainer :pieces="pieces" :loading="loading" />

        <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-800 rounded-lg">
            Failed to load music collection: {{ error.message }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import MusicTableContainer from '~/components/MusicTable/MusicTableContainer.vue'
import { useMusicData } from '~/composables/useMusicData'

// Get music data from composable
const { pieces, loading, error, fetchPieces } = useMusicData()

// Fetch data on component mount
onMounted(() => {
    fetchPieces()
})
</script>