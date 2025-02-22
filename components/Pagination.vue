<template>
  <div class="flex items-center space-x-2">
    <button
      :disabled="currentPage === 1"
      @click="$emit('pageChange', currentPage - 1)"
      class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Prev
    </button>
    <span class="text-white">
      Page {{ currentPage }} of {{ totalPages }}
    </span>
    <button
      :disabled="currentPage === totalPages"
      @click="$emit('pageChange', currentPage + 1)"
      class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    totalPages: {
      type: Number,
      default: 1,
    },
  },
};
</script>
