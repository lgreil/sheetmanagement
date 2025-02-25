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
                <template #header="{ column }">
                    <div class="flex items-center justify-between">
                        <span>{{ column.label }}</span>
                        <UButton @click="column.toggleSorting()" variant="ghost" class="ml-2">
                            <Icon :name="column.getIsSorted() === 'asc' ? 'lucide:arrow-up' : 'lucide:arrow-down'" />
                        </UButton>
                    </div>
                </template>
                <template #cell="{ row, column }">
                    <div class="flex items-center">
                        <span>{{ row.getValue(column.accessorKey) }}</span>
                        <Icon v-if="column.accessorKey === 'isdigitalisiert'"
                            :name="row.getValue('isdigitalisiert') ? 'lucide:check-circle' : 'lucide:x-circle'"
                            class="ml-2" />
                    </div>
                </template>
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
import { UButton, UInput, UPagination, UTable } from '#components'
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

const columns: TableColumn<Stueck>[] = [
    {
        accessorKey: 'name',
        header: createSortableHeader('Name'),
        cell: ({ row }) => row.getValue('name'),
        enableSorting: true,
    },
    {
        accessorKey: 'genre',
        header: createSortableHeader('Genre'),
        cell: ({ row }) => row.getValue('genre'),
        enableSorting: true,
    },
    {
        accessorKey: 'jahr',
        header: createSortableHeader('Year'),
        cell: ({ row }) => {
            const value = row.getValue('jahr') as number
            return value && value !== 0 ? value : 'Unknown'
        },
        enableSorting: true,
    },
    {
        accessorKey: 'schwierigkeit',
        header: createSortableHeader('Difficulty'),
        cell: ({ row }) => row.getValue('schwierigkeit'),
        enableSorting: true,
    },
    {
        accessorKey: 'isdigitalisiert',
        header: createSortableHeader('Digitized'),
        cell: ({ row }) => (row.getValue('isdigitalisiert') ? 'Yes' : 'No'),
        enableSorting: true,
    },
    {
        accessorKey: 'composer_names',
        header: createSortableHeader('Composer(s)'),
        cell: ({ row }) => {
            const composers = row.getValue('composer_names') as string[]
            return composers.length > 0 ? composers.join(', ') : 'Unknown'
        },
        enableSorting: true,
    },
    {
        accessorKey: 'arranger_names',
        header: createSortableHeader('Arranger(s)'),
        cell: ({ row }) => {
            const arrangers = row.getValue('arranger_names') as string[]
            return arrangers.length > 0 ? arrangers.join(', ') : 'Unknown'
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
</style>
