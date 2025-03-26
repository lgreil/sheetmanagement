import { h, ref, computed } from "vue"
import { useState } from "#app"
import type { TableColumn } from "@nuxt/ui"
import type { Piece } from "~/types/Types"
import type { TableState, TableFilters, TableSort } from "~/types/table"
import GenreBadge from "~/components/MusicTable/GenreBadge.vue"
import DifficultyIndicator from "~/components/MusicTable/DifficultyIndicator.vue"
import DigitizedIndicator from "~/components/MusicTable/DigitizedIndicator.vue"

export function useMusicTable() {
  // Define table columns with proper component rendering
  const columns: TableColumn<Piece>[] = [
    {
      id: 'name',
      label: 'Name',
      sortable: true,
      accessor: (row: Piece) => row.name
    },
    {
      id: 'genre',
      label: 'Genre',
      sortable: true,
      accessor: (row: Piece) => row.genre,
      render: (row: Piece) => h(GenreBadge, { genre: row.genre })
    },
    {
      id: 'komponiert',
      label: 'Composer',
      sortable: true,
      accessor: (row: Piece) => row.komponiert.map(k => `${k.vorname} ${k.name}`).join(', ')
    },
    {
      id: 'arrangiert',
      label: 'Arranger',
      sortable: true,
      accessor: (row: Piece) => row.arrangiert.map(a => `${a.vorname} ${a.name}`).join(', ')
    },
    {
      id: 'schwierigkeit',
      label: 'Difficulty',
      sortable: true,
      accessor: (row: Piece) => row.schwierigkeit,
      render: (row: Piece) => h(DifficultyIndicator, { level: row.schwierigkeit })
    },
    {
      id: 'isdigitalisiert',
      label: 'Digital',
      sortable: true,
      accessor: (row: Piece) => row.isdigitalisiert,
      render: (row: Piece) => h(DigitizedIndicator, { isDigitized: row.isdigitalisiert })
    },
    {
      id: 'jahr',
      label: 'Year',
      sortable: true,
      accessor: (row: Piece) => row.jahr !== null ? row.jahr.toString() : ''
    },
    {
      id: 'actions',
      label: '',
      render: (row: Piece) => h('div', { class: 'flex items-center gap-2' }, [
        h('UButton', {
          icon: 'i-heroicons-eye',
          variant: 'ghost',
          color: 'gray',
          size: 'xs',
          to: `/stueck/${row.stid}`
        }),
        h('UButton', {
          icon: 'i-heroicons-pencil-square',
          variant: 'ghost',
          color: 'gray',
          size: 'xs',
          to: `/stueck/${row.stid}/edit`
        })
      ])
    }
  ]

  // State management with proper typing
  const state = useState<TableState>('musicTable', () => ({
    pieces: [],
    pageIndex: 0,
    pageSize: 10,
    globalFilter: '',
    sorting: [],
    loading: false,
    error: null
  }))

  // Computed properties
  const totalItems = computed(() => state.value.pieces.length)
  const filteredItems = computed(() => {
    let items = [...state.value.pieces]

    // Apply global filter
    if (state.value.globalFilter) {
      const filter = state.value.globalFilter.toLowerCase()
      items = items.filter(piece => 
        piece.name.toLowerCase().includes(filter) ||
        piece.komponiert.some(composer => 
          composer.vorname.toLowerCase().includes(filter) || 
          composer.name.toLowerCase().includes(filter)
        ) ||
        (piece.arrangiert?.some(arranger => 
          arranger.vorname.toLowerCase().includes(filter) || 
          arranger.name.toLowerCase().includes(filter)
        ) || false) ||
        piece.genre.toLowerCase().includes(filter)
      )
    }

    // Apply sorting with type safety
    if (state.value.sorting.length) {
      const sort = state.value.sorting[0] as TableSort
      items.sort((a, b) => {
        const aValue = sort.id in a ? a[sort.id as keyof Piece] : null
        const bValue = sort.id in b ? b[sort.id as keyof Piece] : null
        
        if (aValue === null || bValue === null) return 0
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sort.desc ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
        }
        
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          return sort.desc ? (bValue === aValue ? 0 : bValue ? 1 : -1) : (aValue === bValue ? 0 : aValue ? 1 : -1)
        }
        
        return sort.desc ? (bValue > aValue ? 1 : -1) : (aValue > bValue ? 1 : -1)
      })
    }

    return items
  })

  const paginatedItems = computed(() => {
    const start = state.value.pageIndex * state.value.pageSize
    const end = start + state.value.pageSize
    return filteredItems.value.slice(start, end)
  })

  // Type-safe actions
  function setPieces(pieces: Piece[]) {
    state.value.pieces = pieces
  }

  function setLoading(loading: boolean) {
    state.value.loading = loading
  }

  function setError(error: string | null) {
    state.value.error = error
  }

  function updateFilters(filters: TableFilters) {
    state.value = { ...state.value, ...filters }
  }

  return {
    state: readonly(state),
    columns,
    totalItems,
    filteredItems,
    paginatedItems,
    setPieces,
    setLoading,
    setError,
    updateFilters
  }
}
