
// composables/useMusicTable.ts
import { h } from 'vue'
import { UButton, UTooltip } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { Piece } from '~/types/music'
import DifficultyIndicator from '~/components/MusicTable/DifficultyIndicator.vue'
import DigitizedIndicator from '~/components/MusicTable/DigitizedIndicator.vue'
import NameList from '~/components/MusicTable/NameList.vue'

export function useMusicTable() {
    // Create sortable header with consistent styling
    function createSortableHeader(label: string) {
        return ({ column }: { column: any }) => {
            const isSorted = column.getIsSorted()

            return h(
                UButton,
                {
                    label,
                    icon: isSorted
                        ? isSorted === 'asc'
                            ? 'i-lucide-arrow-up'
                            : 'i-lucide-arrow-down'
                        : 'i-lucide-arrow-up-down',
                    variant: 'ghost',
                    color: isSorted ? 'primary' : 'neutral',
                    class: 'font-medium',
                    onClick: () => column.toggleSorting(isSorted === 'asc'),
                },
                label
            )
        }
    }

    // Function to map difficulty levels to numerical values for sorting
    function getDifficultyValue(difficulty: string): number {
        switch (difficulty) {
            case 'easy': return 1
            case 'medium': return 2
            case 'hard': return 3
            case 'very hard': return 4
            default: return 0
        }
    }

    // Utility for name sorting
    function extractLastName(fullName: string): string {
        const trimmedName = fullName.trim()

        // Handle format like "J.S. Bach"
        if (/^[A-Z]\.[A-Z]\./.test(trimmedName)) {
            const parts = trimmedName.split(' ')
            return parts.length > 1 ? parts[parts.length - 1] : trimmedName
        }

        // Regular format: "Johann Sebastian Bach"
        const nameParts = trimmedName.split(' ')
        return nameParts.length > 1 ? nameParts[nameParts.length - 1] : trimmedName
    }

    // Custom sorting function for composer/arranger names
    function nameArraySortingFn(rowA: any, rowB: any, columnId: string): number {
        const namesA = rowA.getValue(columnId) as string[] || []
        const namesB = rowB.getValue(columnId) as string[] || []

        const nameA = namesA.length > 0 ? namesA[0] : ''
        const nameB = namesB.length > 0 ? namesB[0] : ''

        const lastNameA = extractLastName(nameA).toLowerCase()
        const lastNameB = extractLastName(nameB).toLowerCase()

        // First compare last names
        if (lastNameA !== lastNameB) {
            return lastNameA.localeCompare(lastNameB)
        }

        // If last names are the same, compare the full names
        return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
    }

    // Global filtering function that searches all columns
    const getFilteredRowsModel = (rows: any[], columnIds: string[], filterValue: string) => {
        if (!filterValue || filterValue === '') return rows

        const searchLower = filterValue.toLowerCase()

        return rows.filter(row => {
            // Check each field for matches
            const nameMatch = String(row.getValue('name') || '').toLowerCase().includes(searchLower)
            const genreMatch = String(row.getValue('genre') || '').toLowerCase().includes(searchLower)
            const yearMatch = String(row.getValue('jahr') || '').toLowerCase().includes(searchLower)
            const difficultyMatch = String(row.getValue('schwierigkeit') || '').toLowerCase().includes(searchLower)

            // Array fields need special handling
            const composerNames = row.getValue('composer_names') as string[] || []
            const composerMatch = composerNames.some(name =>
                name.toLowerCase().includes(searchLower)
            )

            const arrangerNames = row.getValue('arranger_names') as string[] || []
            const arrangerMatch = arrangerNames.some(name =>
                name.toLowerCase().includes(searchLower)
            )

            return nameMatch || genreMatch || yearMatch || difficultyMatch || composerMatch || arrangerMatch
        })
    }

    // Table column definitions
    const columns: TableColumn<Piece>[] = [
        {
            accessorKey: 'name',
            header: createSortableHeader('Name'),
            cell: ({ row }) => h('div', { class: 'font-medium' }, row.getValue('name') || ''),
            enableSorting: true,
        },
        {
            accessorKey: 'genre',
            header: createSortableHeader('Genre'),
            cell: ({ row }) => {
                const genre = row.getValue('genre') as string
                return h('span', {
                    class: 'px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700'
                }, [genre || '-']) // Wrap in an array and use a dash instead of empty string
            },
            enableSorting: true,
        },
        {
            accessorKey: 'jahr',
            header: createSortableHeader('Year'),
            cell: ({ row }) => {
                const value = row.getValue('jahr') as number
                return h('span', { class: 'text-center block' }, [value && value !== 0 ? value.toString() : '-'])
            },
            enableSorting: true,
        },
        {
            accessorKey: 'schwierigkeit',
            header: createSortableHeader('Difficulty'),
            cell: ({ row }) => {
                return h(DifficultyIndicator, {
                    difficulty: String(row.getValue('schwierigkeit') || '')
                })
            },
            enableSorting: true,
            sortingFn: (rowA, rowB) => {
                const difficultyA = getDifficultyValue(rowA.getValue('schwierigkeit'))
                const difficultyB = getDifficultyValue(rowB.getValue('schwierigkeit'))
                return difficultyA - difficultyB
            },
        },
        {
            accessorKey: 'isdigitalisiert',
            header: createSortableHeader('Digitized'),
            cell: ({ row }) => {
                return h(DigitizedIndicator, {
                    isDigitized: row.getValue('isdigitalisiert') as boolean
                })
            },
            enableSorting: true,
        },
        {
            accessorKey: 'composer_names',
            header: createSortableHeader('Composer(s)'),
            cell: ({ row }) => {
                return h(NameList, {
                    names: row.getValue('composer_names') as string[] || []
                })
            },
            enableSorting: true,
            sortingFn: (rowA, rowB) => nameArraySortingFn(rowA, rowB, 'composer_names'),
        },
        {
            accessorKey: 'arranger_names',
            header: createSortableHeader('Arranger(s)'),
            cell: ({ row }) => {
                return h(NameList, {
                    names: row.getValue('arranger_names') as string[] || []
                })
            },
            enableSorting: true,
            sortingFn: (rowA, rowB) => nameArraySortingFn(rowA, rowB, 'arranger_names'),
        },
    ]

    return {
        columns,
        getFilteredRowsModel
    }
}
