<template>
  <div class="table-container">
    <!-- Pagination Component -->
    <Pagination
      :currentPage="currentPage"
      :totalPages="totalPages"
      @pageChange="handlePageChange"
    />

    <!-- AddEntry Component now listens for a failure event -->
    <AddEntry @add-entry-failure="handleFailure" />

    <!-- Search Bar Component -->
    <SearchBar @search="updateSearch" />

    <table class="table">
      <thead class="thead-dark">
        <tr>
          <!-- Loop through columns and add sorting -->
          <th
            v-for="column in columns"
            :key="column.key"
            @click="sortTable(column.key)"
          >
            {{ column.label }}
            <span v-if="sortKey === column.key">
              <i class="fas" :class="sortAsc ? 'fa-sort-up' : 'fa-sort-down'"></i>
            </span>
          </th>
          <th v-if="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loop through the filtered, sorted, and paginated items -->
        <TableEntry
          v-for="item in paginatedItems"
          :key="item.id"
          :item="item"
          :columns="columns"
          :actions="actions"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </tbody>
    </table>

    <!-- PopupMessage Component used for displaying failure messages -->
    <PopupMessage ref="popup" />
  </div>
</template>

<script>
import TableEntry from './TableEntry.vue';
import Pagination from './Pagination.vue';
import SearchBar from './SearchBar.vue';
import AddEntry from './AddEntry.vue';
import PopupMessage from './PopupMessage.vue';

export default {
  name: 'Table',
  components: {
    TableEntry,
    Pagination,
    SearchBar,
    AddEntry,
    PopupMessage
  },
  props: {
    items: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      required: true
    },
    actions: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      sortKey: '',
      sortAsc: true,
      perPage: 5,
      currentPage: 1,
      searchQuery: '',
      // Local copy of items for internal manipulation
      tableItems: this.items
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
      return this.sortedItems.filter(item =>
        Object.values(item).some(val =>
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
    }
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
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        this.tableItems = data;
      } catch (error) {
        console.error(error);
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
      this.$refs.popup.showMessage('not yet implemented', 'error');
    }
  },
  // Update local items when the prop changes
  watch: {
    items(newItems) {
      this.tableItems = newItems;
    }
  }
};
</script>

<style scoped>
.table-container {
  margin-top: 20px;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.thead-dark {
  background-color: #f2f2f2;
}
</style>
