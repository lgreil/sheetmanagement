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
          :pagination-options="{ getPaginationRowModel: getPaginationRowModel() }" v-model:global-filter="globalFilter"
          v-model:sorting="sorting" :loading="loading" loading-color="primary" loading-animation="carousel"
          :data="pieces || []" :columns="columns" :get-filtered-rows-model="getFilteredRowsModel" hover
          class="w-full table-auto">
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
const props = defineProps < {
  pieces?: Piece[]
    loading: boolean
} > ()

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

<style>
/* Add this to your component's <style> section or to your global CSS */
@media (max-width: 768px) {
  .music-table-container {
    border-radius: 0.5rem;
  }

  .music-table-row td {
    padding: 0.75rem 0.5rem;
  }

  .genre-badge,
  .difficulty-badge {
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
  }
}

.digitized-indicator {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.digitized-indicator.yes {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.genre-badge {
  transform: translateY(0);
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.genre-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.music-table-header-btn {
  position: relative;
  overflow: hidden;
}

.music-table-header-btn:after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background-color: #3b82f6;
  transition: width 0.3s ease;
}

.music-table-header-btn:hover:after,
.music-table-header-btn.active:after {
  width: 100%;
}
.music-table-row {
  transition: background-color 0.3s ease;
}

.music-table-row:hover {
  background-color: rgba(30, 58, 138, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
/* Main container styling with dark mode support */
/* Main container styling with dark mode support */
.music-table-container {
  background-image: linear-gradient(145deg, #1e3a8a, #1e40af);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2),
    0 8px 10px -6px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}
/* Button styling for column headers */
.music-table-header-btn {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  width: 100%;
}

.music-table-header-btn:hover {
  background-color: rgba(30, 58, 138, 0.5);
}

.music-table-header-btn.active {
  background-color: rgba(30, 58, 138, 0.7);
}

/* Search input styling */
.music-search-input {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(30, 58, 138, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  transition: all 0.3s ease;
  color: white;
  width: 100%;
}

.music-search-input:focus-within {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(59, 130, 246, 0.5);
}

.music-search-input input {
  background-color: transparent;
  border: none;
  outline: none;
  width: 100%;
  color: white;
}

.music-search-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* Genre badge styling */
.genre-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.3s;
}

.genre-badge.traditionell {
  background-image: linear-gradient(to right, #059669, #047857);
  color: white;
}

.genre-badge.klassik {
  background-image: linear-gradient(to right, #4f46e5, #7c3aed);
  color: white;
}

.genre-badge.barock {
  background-image: linear-gradient(to right, #d97706, #b45309);
  color: white;
}

.genre-badge.moderne-klassik {
  background-image: linear-gradient(to right, #06b6d4, #3b82f6);
  color: white;
}

.genre-badge.romantik {
  background-image: linear-gradient(to right, #f43f5e, #e11d48);
  color: white;
}

.genre-badge.musicals {
  background-image: linear-gradient(to right, #8b5cf6, #7c3aed);
  color: white;
}

.genre-badge.pop-rock-modern {
  background-image: linear-gradient(to right, #f87171, #ef4444);
  color: white;
}

.genre-badge.weihnachtsmusik {
  background-image: linear-gradient(to right, #34d399, #10b981);
  color: white;
}

.genre-badge.filmmusik {
  background-image: linear-gradient(to right, #f59e0b, #d97706);
  color: white;
}

/* Difficulty badge styling */
.difficulty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.difficulty-badge.unknown {
  background-color: rgba(107, 114, 128, 0.5);
  color: white;
}

.difficulty-badge.medium {
  background-image: linear-gradient(to right, #f59e0b, #ea580c);
  color: white;
}

/* Digitized indicator */
.digitized-indicator {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
}

.digitized-indicator.yes {
  background-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.digitized-indicator.no {
  background-color: #9ca3af;
}

/* Table row styling */
.music-table-row {
  border-bottom: 1px solid rgba(30, 58, 138, 0.3);
  transition: color 0.2s;
}

.music-table-row:hover {
  background-color: rgba(30, 58, 138, 0.2);
}

.music-table-row td {
  padding: 1rem;
}

/* Pagination styling - improved buttons */
.pagination-button {
  background-color: rgba(30, 58, 138, 0.3);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  color: white;
  transition: color 0.2s;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.pagination-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.4));
  transition: left 0.3s ease;
  z-index: -1;
}

.pagination-button:hover:before {
  left: 0;
}


.pagination-button:hover {
  background-color: rgba(30, 58, 138, 0.5);
}

.pagination-button.active {
  box-shadow: 0 0 10px rgba(37, 99, 235, 0.5);
  background-color: #2563eb;
}

/* Page size selector */
.page-size-selector {
  background-color: rgba(30, 58, 138, 0.3);
  border: 1px solid rgba(30, 58, 138, 0.3);
  border-radius: 0.375rem;
  color: white;
  padding: 0.25rem 0.5rem;
  appearance: none;
  position: relative;
  padding-right: 2rem;
}

.page-size-container {
  position: relative;
}

.page-size-container:after {
  content: "▼";
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  pointer-events: none;
}
</style>