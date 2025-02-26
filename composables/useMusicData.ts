// composables/useMusicData.ts
import { ref } from 'vue'
import type { Piece } from '~/types/music'

export function useMusicData() {
    const pieces = ref<Piece[]>([])
    const loading = ref(true)
    const error = ref<Error | null>(null)

    async function fetchPieces() {
        loading.value = true
        error.value = null

        try {
            const { data } = await useFetch<Piece[]>('http://localhost:3005/stuecke')
            pieces.value = data.value || []
        } catch (err) {
            error.value = err as Error
        } finally {
            loading.value = false
        }
    }

    return {
        pieces,
        loading,
        error,
        fetchPieces
    }
}