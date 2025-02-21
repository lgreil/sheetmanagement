<template>
  <div class="pagination">
    <button :disabled="currentPage === 1" @click="$emit('pageChange', currentPage - 1)">
      Prev
    </button>
    <span>Page {{ currentPage }} of {{ totalPages }}</span>
    <button :disabled="currentPage === totalPages" @click="$emit('pageChange', currentPage + 1)">
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
      default: 1
    },
    totalPages: {
      type: Number,
      default: 1
    }
  }
};
</script>

<style scoped>
.pagination {
  margin-bottom: 10px;
}
button {
  margin: 0 5px;
}
</style>
