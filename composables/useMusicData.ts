import { ref } from 'vue'
import type { Piece } from '~/types/music'

export function useMusicData() {
    const pieces = ref<Piece[]>([])
    const loading = ref(true)
    const error = ref<Error | null>(null)

    async function fetchPieces() {
        loading.value = true
        error.value = null

        console.log('Fetching pieces...')

        try {
            const { data } = await useFetch<Piece[]>('http://localhost:3005/stuecke')
            pieces.value = data.value || []
            console.log('Fetched pieces:', pieces.value)
        } catch (err) {
            error.value = err as Error
            console.error('Error fetching pieces:', error.value)
        } finally {
            loading.value = false
            console.log('Loading state:', loading.value)
        }
    }

    return {
        pieces,
        loading,
        error,
        fetchPieces
    }
}