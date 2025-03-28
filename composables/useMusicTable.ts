import { reactive, computed, watch } from 'vue'
import type { Piece } from '~/types/Types'
import type { TableSort } from '~/types/table'

interface MusicTableState {
  pieces: Piece[]
  pageIndex: number
  pageSize: number
  globalFilter: string
  sorting: TableSort[]
}

export function useMusicTable() {
  const state = reactive<MusicTableState>({
    pieces: [],
    pageIndex: 0,
    pageSize: 10,
    globalFilter: '',
    sorting: [{ id: 'name', desc: false }]
  })

  const totalItems = computed(() => state.pieces.length)

  const filteredItems = computed(() => {
    if (!state.globalFilter) {
      return state.pieces
    }
    const filterText = state.globalFilter.toLowerCase()
    return state.pieces.filter((piece) => {
      return (
        piece.name.toLowerCase().includes(filterText) ||
        piece.genre.toLowerCase().includes(filterText) ||
        String(piece.jahr).includes(filterText)
      )
    })
  })

  const sortedItems = computed(() => {
    const items = [...filteredItems.value]
    if (state.sorting.length === 0) {
      return items
    }

    const { id, desc } = state.sorting[0]
    return items.sort((a, b) => {
      const valueA = a[id as keyof Piece]
      const valueB = b[id as keyof Piece]

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB)
        return desc ? -comparison : comparison
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        return desc ? valueB - valueA : valueA - valueB
      } else {
        return 0
      }
    })
  })

  const paginatedItems = computed(() => {
    const start = state.pageIndex * state.pageSize
    const end = start + state.pageSize
    return sortedItems.value.slice(start, end)
  })

  const setPieces = (newPieces: Piece[]) => {
    state.pieces = newPieces
  }

  const updateFilters = (newFilters: Partial<MusicTableState>) => {
    Object.assign(state, newFilters)
  }

  watch(
    () => state.pageSize,
    () => {
      state.pageIndex = 0
    }
  )

  return {
    state,
    totalItems,
    paginatedItems,
    setPieces,
    updateFilters
  }
}
