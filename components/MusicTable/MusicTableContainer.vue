<template>
    <div class="w-full max-w-7xl mx-auto space-y-6 p-4">
        <!-- Search component -->
        <MusicTableSearch v-model="globalFilter" />

        <!-- Table Card -->
        <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <!-- Table Component -->
            <div class="overflow-x-auto">
                <UTable ref="table" v-model:pagination="pagination"
                    :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }"
                    v-model:global-filter="globalFilter" v-model:sorting="sorting" :loading="loading"
                    loading-color="primary" loading-animation="carousel" :data="pieces || []" :columns="columns"
                    :get-filtered-rows-model="getFilteredRowsModel" hover class="w-full table-auto">
                </UTable>
            </div>

            <!-- Pagination Component -->
            <MusicTablePagination v-model:page-index="pagination.pageIndex" v-model:page-size="pagination.pageSize"
                :total-items="pieces ? pieces.length : 0" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UTable } from '#components'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { useMusicTable } from '#imports'
import MusicTableSearch from './MusicTableSearch.vue'
import MusicTablePagination from './MusicTablePagination.vue'
import type { Piece } from '~/types/music.ts'

// Props and emits
const props = defineProps<{
    pieces?: Piece[]
    loading: boolean
}>()

// Table state
const globalFilter = ref('')
const sorting = ref([{ id: 'name', desc: false }])
const pagination = ref({
    pageIndex: 0,
    pageSize: 10,
})

// Get table utilities from composable
const { columns, getFilteredRowsModel } = useMusicTable()
</script>