<template>
  <div class="table-container mt-5">
    <!-- Flex container for Pagination and Add Entry -->
    <div class="flex items-center justify-between mb-4">
      <Pagination :currentPage="currentPage" :totalPages="totalPages" @pageChange="handlePageChange" />
      <button @click="handleAdd" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
        Add Entry
      </button>
    </div>

    <!-- Search Bar Component -->
    <SearchBar @search="updateSearch" class="mb-4" />

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <!-- Loop through columns and add sorting -->
            <th v-for="column in columns" :key="column.key" @click="sortTable(column.key)"
              class="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider cursor-pointer hover:bg-gray-100">
              <div class="flex items-center">
                {{ column.label }}
                <span v-if="sortKey === column.key" class="ml-1">
                  <svg v-if="sortAsc" class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06-.02L10 10.862l3.71-3.672a.75.75 0 111.06 1.064l-4.24 4.2a.75.75 0 01-1.06 0l-4.24-4.2a.75.75 0 01-.02-1.06z"
                      clip-rule="evenodd" />
                  </svg>
                  <svg v-else class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M14.77 12.79a.75.75 0 01-1.06.02L10 9.138l-3.71 3.672a.75.75 0 11-1.06-1.064l4.24-4.2a.75.75 0 011.06 0l4.24 4.2a.75.75 0 01.02 1.06z"
                      clip-rule="evenodd" />
                  </svg>
                </span>
              </div>
            </th>
            <th v-if="actions" class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <!-- Display loading animation if data is being fetched -->
          <template v-if="loading">
            <USkeleton v-for="n in 5" :key="n" class="h-10 my-2" />
          </template>
          <template v-else>
            <!-- Loop through the filtered, sorted, and paginated items -->
            <TableEntry v-for="item in paginatedItems" :key="item.id" :item="item" :columns="columns" :actions="actions"
              @edit="handleEdit" @delete="handleDelete" />
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import TableEntry from './TableEntry.vue';
import Pagination from './Pagination.vue';
import SearchBar from './SearchBar.vue';

export default {
  name: 'Table',
  components: {
    TableEntry,
    Pagination,
    SearchBar,
  },
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    columns: {
      type: Array,
      required: true,
    },
    actions: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      sortKey: '',
      sortAsc: true,
      perPage: 5,
      currentPage: 1,
      searchQuery: '',
      // Local copy of items for internal manipulation
      tableItems: this.items,
      loading: false,
    };
  },
  computed: {
    // Sort the items based on the selected column and order
    sortedItems() {
      let sorted = [...this.tableItems];
      if (this.sortKey) {
        sorted.sort((a, b) => {
          let valA = a[this.sortKey] ?? '';
          let valB = b[this.sortKey] ?? '';
          if (valA < valB) return this.sortAsc ? -1 : 1;
          if (valA > valB) return this.sortAsc ? 1 : -1;
          return 0;
        });
      }
      return sorted;
    },
    // Filter the sorted items based on the search query
    filteredItems() {
      if (!this.searchQuery) return this.sortedItems;
      return this.sortedItems.filter((item) =>
        Object.values(item).some((val) =>
          String(val).toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      );
    },
    // Select only the items for the current page
    paginatedItems() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredItems.slice(start, start + this.perPage);
    },
    totalPages() {
      return Math.ceil(this.filteredItems.length / this.perPage);
    },
  },
  methods: {
    sortTable(key) {
      if (this.sortKey === key) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortKey = key;
        this.sortAsc = true;
      }
    },
    async fetchEntries(endpoint) {
      this.loading = true;
      try {
        const response = await $fetch(endpoint);
        const data = await response.json();
        this.tableItems = data;
      } catch (error) {
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
    handlePageChange(page) {
      this.currentPage = page;
    },
    updateSearch(query) {
      this.searchQuery = query;
      this.currentPage = 1;
    },
    handleEdit(item) {
      this.$emit('edit', item);
    },
    handleDelete(item) {
      this.$emit('delete', item);
    },
    handleAdd() {
      this.$emit('add');
    },
    // This method is called when a called Component emits a failure event
    handleFailure() {
      this.toast.add('Not yet implemented', 'error');
    },
  },
  // Update local items when the prop changes
  watch: {
    items(newItems) {
      this.tableItems = newItems;
    },
  },
};
</script>

<style scoped>
/* Remove old styles since we're using Tailwind classes */
.table-container {
  /* margin-top: 20px; */
}
</style>
