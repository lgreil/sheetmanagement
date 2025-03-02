import { ref, onMounted, watch } from 'vue'
import type { Piece } from '~/types/music'

export function useMusicData(pageIndex: number, pageSize: number) {
    const pieces = ref<Piece[]>([])
    const loading = ref(true)
    const error = ref<Error | null>(null)

    async function fetchPieces() {
        loading.value = true
        error.value = null

        try {
            const { data } = await useFetch<Piece[]>(`http://localhost:3005/stuecke?page=${pageIndex}&size=${pageSize}`)
            pieces.value = data.value || []
        } catch (err) {
            error.value = err as Error
            console.error('Error fetching pieces:', error.value)
        } finally {
            loading.value = false
        }
    }

    // Fetch data on component mount and when pageIndex or pageSize changes
    onMounted(() => {
        fetchPieces()
    })

    watch([pageIndex, pageSize], () => {
        fetchPieces()
    })

    return {
        pieces,
        loading,
        error,
        fetchPieces
    }
}
