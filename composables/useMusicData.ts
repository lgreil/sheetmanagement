export function useMusicData(initialPageIndex = 0, initialPageSize = 10) {
    const pageIndex = ref(initialPageIndex)
    const pageSize = ref(initialPageSize)
    const pieces = ref<Piece[]>([])
    const loading = ref(true)
    const error = ref<Error | null>(null)

    async function fetchPieces() {
        loading.value = true
        error.value = null
        try {
            const { data } = await useFetch<Piece[]>(`http://localhost:3005/stuecke?page=${pageIndex.value}&size=${pageSize.value}`)
            pieces.value = data.value || []
        } catch (err) {
            error.value = err as Error
            console.error('Error fetching pieces:', error.value)
        } finally {
            loading.value = false
        }
    }

    // Fetch data on component mount
    onMounted(() => {
        fetchPieces()
    })

    // Watch for changes to pagination
    watch([pageIndex, pageSize], () => {
        fetchPieces()
    })

    return {
        pieces,
        loading,
        error,
        fetchPieces,
        pageIndex,
        pageSize
    }
}