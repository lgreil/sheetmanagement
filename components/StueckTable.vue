<template>
    <div class="w-full max-w-7xl mx-auto space-y-4 pb-4">
        <div
            class="flex px-4 py-3.5 border-b border-(--ui-border-accented) bg-white dark:bg-gray-900 rounded-t-lg shadow-md">
            <UInput v-model="globalFilter" class="max-w-sm" placeholder="Filter..." />
        </div>

        <div class="overflow-x-auto bg-white dark:bg-gray-900 rounded-b-lg shadow-md">
            <UTable ref="table" v-model:pagination="pagination"
                :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
                v-model:global-filter="globalFilter" v-model:sorting="sorting" :loading="status === 'pending'"
                loading-color="primary" loading-animation="carousel" :data="data || []" :columns="columns"
                class="w-full table-fixed">
            </UTable>
        </div>

        <div
            class="flex justify-center border-t border-(--ui-border) pt-4 bg-white dark:bg-gray-900 rounded-b-lg shadow-md">
            <UPagination :model-value="pagination.pageIndex + 1" :default-page="pagination.pageIndex + 1"
                :items-per-page="pagination.pageSize" :total="data ? data.length : 0"
                @update:page="(p: number) => (pagination.pageIndex = p - 1)" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { UButton, UInput, UPagination, UTable, UTooltip } from '#components'
import { getPaginationRowModel } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { ref, h } from 'vue'

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

// Reusable header function
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
                class: '-mx-2.5',
                onClick: () => column.toggleSorting(isSorted === 'asc'),
            },
            label
        )
    }
}

function getDifficultyClass(difficulty: string) {
    switch (difficulty) {
        case 'easy':
            return 'bg-green-500 w-1/4';
        case 'medium':
            return 'bg-yellow-500 w-1/2';
        case 'hard':
            return 'bg-red-500 w-3/4';
        case 'very hard':
            return 'bg-red-900 w-full';
        case 'Unknown':
            return 'bg-gray-500 w-0';
        default:
            return 'bg-gray-500 w-0';
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

const columns: TableColumn<Stueck>[] = [
    {
        accessorKey: 'name',
        header: createSortableHeader('Name'),
        cell: ({ row }) => row.getValue('name') || '',
        enableSorting: true,
    },
    {
        accessorKey: 'genre',
        header: createSortableHeader('Genre'),
        cell: ({ row }) => row.getValue('genre') || '',
        enableSorting: true,
    },
    {
        accessorKey: 'jahr',
        header: createSortableHeader('Year'),
        cell: ({ row }) => {
            const value = row.getValue('jahr') as number
            return value && value !== 0 ? value : ''
        },
        enableSorting: true,
    },
    {
        accessorKey: 'schwierigkeit',
        header: createSortableHeader('Difficulty'),
        cell: ({ row }) => {
            const difficulty = row.getValue('schwierigkeit') || ''
            const percentage = getDifficultyPercentage(difficulty)
            const tooltipContent = `Difficulty: ${difficulty}`

            return h(
                UTooltip,
                { content: tooltipContent },
                h('div', {
                    class: `relative h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700`,
                    'aria-valuenow': percentage,
                    'aria-valuemin': 0,
                    'aria-valuemax': 100,
                    role: 'progressbar',
                }, [
                    h('div', {
                        class: `h-full transition-all ${getDifficultyClass(difficulty)}`,
                        style: { width: `${percentage}%` },
                    })
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
        cell: ({ row }) => row.getValue('isdigitalisiert'),
        enableSorting: true,
    },
    {
        accessorKey: 'composer_names',
        header: createSortableHeader('Composer(s)'),
        cell: ({ row }) => {
            const composers = row.getValue('composer_names') as string[]
            return composers.length > 0 ? composers.join(', ') : ''
        },
        enableSorting: true,
    },
    {
        accessorKey: 'arranger_names',
        header: createSortableHeader('Arranger(s)'),
        cell: ({ row }) => {
            const arrangers = row.getValue('arranger_names') as string[]
            return arrangers.length > 0 ? arrangers.join(', ') : ''
        },
        enableSorting: true,
    },
]

const pagination = ref({
    pageIndex: 0,
    pageSize: 5,
})
</script>

<style scoped>
/* Ensure the table takes up 90% of the screen size */
.w-full {
    width: 90%;
}

/* Zebra striping for table rows */
.UTable tr:nth-child(even) {
    background-color: #f9f9f9;
}

.UTable tr:nth-child(odd) {
    background-color: #ffffff;
}

.dark .UTable tr:nth-child(even) {
    background-color: #2d2d2d;
}

.dark .UTable tr:nth-child(odd) {
    background-color: #1f1f1f;
}

/* Hover effects for table rows */
.UTable tr:hover {
    background-color: #e2e8f0;
}

.dark .UTable tr:hover {
    background-color: #374151;
}

/* Fixed headers */
.UTable thead th {
    position: sticky;
    top: 0;
    background-color: inherit;
    z-index: 1;
}

/* Progress bar styles */
.bg-green-500 {
    background-color: #48bb78;
}

.bg-yellow-500 {
    background-color: #ecc94b;
}

.bg-red-500 {
    background-color: #f56565;
}

.bg-red-900 {
    background-color: #742a2a;
}

.bg-gray-500 {
    background-color: #a0aec0;
}
</style>