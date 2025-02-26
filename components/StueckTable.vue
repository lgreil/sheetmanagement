<template>
    <div class="w-full max-w-7xl mx-auto space-y-6 p-4">
        <!-- Search with explanatory text -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
            <div class="mb-2 text-sm text-gray-600 dark:text-gray-400">
                Search across all columns (name, genre, composer, arranger, etc.)
            </div>
            <UInput v-model="globalFilter" class="w-full" placeholder="Search anything..." icon="i-lucide-search" />
        </div>

        <!-- Table Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <!-- Table Component -->
            <div class="overflow-x-auto">
                <UTable 
                    ref="table" 
                    v-model:pagination="pagination"
                    :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
                    v-model:global-filter="globalFilter" 
                    v-model:sorting="sorting" 
                    :loading="status === 'pending'"
                    loading-color="primary" 
                    loading-animation="carousel" 
                    :data="data || []" 
                    :columns="columns"
                    :get-filtered-rows-model="getFilteredRowsModel"
                    hover
                    class="w-full table-auto">
                </UTable>
            </div>

            <!-- Pagination (now inside the same card) -->
            <div class="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Showing page {{ pagination.pageIndex + 1 }} of {{ Math.ceil((data ? data.length : 0) / pagination.pageSize) }}
                </div>
                <UPagination 
                    :model-value="pagination.pageIndex + 1" 
                    :default-page="pagination.pageIndex + 1"
                    :items-per-page="pagination.pageSize" 
                    :total="data ? data.length : 0"
                    @update:page="(p: number) => (pagination.pageIndex = p - 1)" 
                    class="shadow-none" />
                <USelect 
                    v-model="pagination.pageSize"
                    :options="[5, 10, 20, 50]" 
                    placeholder="Items per page"
                    size="sm"
                    class="w-32" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { UButton, UInput, UPagination, UTable, UTooltip, USelect } from '#components'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { FilterFn } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { ref, h, computed } from 'vue'

type Stueck = {
    stid: number
    name: string
    genre: string
    jahr: number
    schwierigkeit: string
    isdigitalisiert: boolean
    composer_names: string[]
    arranger_names: string[]
}

const globalFilter = ref('')

// Fetch Stueck-Data from the API
const { status, data } = await useFetch<Stueck[]>('http://localhost:3005/stuecke')

const sorting = ref([
    {
        id: 'name', // Default sorted column
        desc: false,
    },
])

// Improved header function with better styling
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

// Enhanced difficulty visualization
function getDifficultyClass(difficulty: string) {
    switch (difficulty) {
        case 'easy':
            return 'bg-emerald-500 dark:bg-emerald-600';
        case 'medium':
            return 'bg-amber-500 dark:bg-amber-600';
        case 'hard':
            return 'bg-rose-500 dark:bg-rose-600';
        case 'very hard':
            return 'bg-red-700 dark:bg-red-800';
        case 'Unknown':
        default:
            return 'bg-gray-400 dark:bg-gray-600';
    }
}

function getDifficultyPercentage(difficulty: string) {
    switch (difficulty) {
        case 'easy':
            return 25;
        case 'medium':
            return 50;
        case 'hard':
            return 75;
        case 'very hard':
            return 100;
        default:
            return 0;
    }
}

// Function to map difficulty levels to numerical values
function getDifficultyValue(difficulty: string) {
    switch (difficulty) {
        case 'easy':
            return 1;
        case 'medium':
            return 2;
        case 'hard':
            return 3;
        case 'very hard':
            return 4;
        default:
            return 0;
    }
}

// Custom filter function that searches across all columns
const getFilteredRowsModel = (rows: any[], columnIds: string[], filterValue: string) => {
    if (!filterValue || filterValue === '') return rows

    const searchLower = filterValue.toLowerCase()
    
    return rows.filter(row => {
        // Get all the values from the row
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

// Utility function to extract last name for sorting
function extractLastName(fullName: string): string {
    // Remove any trailing/leading whitespace
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
    
    // Get the first name from each array (or empty string if none)
    const nameA = namesA.length > 0 ? namesA[0] : ''
    const nameB = namesB.length > 0 ? namesB[0] : ''
    
    // Extract last names
    const lastNameA = extractLastName(nameA).toLowerCase()
    const lastNameB = extractLastName(nameB).toLowerCase()
    
    // First compare last names
    if (lastNameA !== lastNameB) {
        return lastNameA.localeCompare(lastNameB)
    }
    
    // If last names are the same, compare the full names
    return nameA.toLowerCase().localeCompare(nameB.toLowerCase())
}

const columns: TableColumn<Stueck>[] = [
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
            }, genre || '')
        },
        enableSorting: true,
    },
    {
        accessorKey: 'jahr',
        header: createSortableHeader('Year'),
        cell: ({ row }) => {
            const value = row.getValue('jahr') as number
            return h('span', { class: 'text-center block' }, value && value !== 0 ? value : '-')
        },
        enableSorting: true,
    },
    {
        accessorKey: 'schwierigkeit',
        header: createSortableHeader('Difficulty'),
        cell: ({ row }) => {
            const difficulty = row.getValue('schwierigkeit') as string || ''
            const percentage = getDifficultyPercentage(difficulty)
            const tooltipContent = `Difficulty: ${difficulty}`

            return h(
                UTooltip,
                { text: tooltipContent },
                h('div', {
                    class: 'relative h-5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700',
                    'aria-valuenow': percentage,
                    'aria-valuemin': 0,
                    'aria-valuemax': 100,
                    role: 'progressbar',
                }, [
                    h('div', {
                        class: `h-full transition-all ${getDifficultyClass(difficulty)}`,
                        style: { width: `${percentage}%` },
                    }),
                    h('span', {
                        class: 'absolute inset-0 flex items-center justify-center text-xs font-semibold ' +
                            (percentage > 50 ? 'text-white' : 'text-gray-800 dark:text-gray-200')
                    }, difficulty)
                ])
            )
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
            const isDigitized = row.getValue('isdigitalisiert') as boolean
            return h('div', { class: 'flex justify-center' }, 
                h('div', {
                    class: isDigitized 
                        ? 'w-4 h-4 rounded-full bg-emerald-500 dark:bg-emerald-600' 
                        : 'w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600',
                    title: isDigitized ? 'Digitized' : 'Not digitized'
                })
            )
        },
        enableSorting: true,
    },
    {
        accessorKey: 'composer_names',
        header: createSortableHeader('Composer(s)'),
        cell: ({ row }) => {
            const composers = row.getValue('composer_names') as string[]
            if (composers.length === 0) return ''
            
            if (composers.length === 1) {
                return composers[0]
            }
            
            return h(
                UTooltip,
                { text: composers.join(', ') },
                h('div', {}, [
                    h('span', {}, composers[0]),
                    h('span', { class: 'text-xs text-gray-500 ml-1' }, `+${composers.length - 1} more`)
                ])
            )
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => nameArraySortingFn(rowA, rowB, 'composer_names'),
    },
    {
        accessorKey: 'arranger_names',
        header: createSortableHeader('Arranger(s)'),
        cell: ({ row }) => {
            const arrangers = row.getValue('arranger_names') as string[]
            if (arrangers.length === 0) return ''
            
            if (arrangers.length === 1) {
                return arrangers[0]
            }
            
            return h(
                UTooltip,
                { text: arrangers.join(', ') },
                h('div', {}, [
                    h('span', {}, arrangers[0]),
                    h('span', { class: 'text-xs text-gray-500 ml-1' }, `+${arrangers.length - 1} more`)
                ])
            )
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => nameArraySortingFn(rowA, rowB, 'arranger_names'),
    },
]

const pagination = ref({
    pageIndex: 0,
    pageSize: 10,
})
</script>

<style scoped>
/* Table styling improvements */
:deep(.UTable th) {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    background-color: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
}

:deep(.dark .UTable th) {
    background-color: #374151;
    border-bottom: 1px solid #4b5563;
}

:deep(.UTable td) {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e5e7eb;
}

:deep(.dark .UTable td) {
    border-bottom: 1px solid #4b5563;
}

/* Remove the last row's bottom border */
:deep(.UTable tr:last-child td) {
    border-bottom: none;
}

/* Row hover styles */
:deep(.UTable tr:hover) {
    background-color: #f3f4f6;
}

:deep(.dark .UTable tr:hover) {
    background-color: #1f2937;
}
</style>