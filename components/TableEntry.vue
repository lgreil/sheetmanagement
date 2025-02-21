<template>
  <tr>
    <td v-for="column in columns" :key="column.key">
    <!-- If the field is an array, join it; otherwise display the value directly -->
    {{ Array.isArray(item[column.key]) ? item[column.key].join(', ') : item[column.key] }}
    </td>
    <td v-if="actions">
      <button @click="editItem(item)">Edit</button>
      <button @click="deleteItem(item)">Delete</button>
    </td>
  </tr>
</template>

<script>
export default {
  name: 'TableEntry',
  props: {
    item: {
      type: Object,
      required: true
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
  methods: {
    editItem(item) {
      this.$emit('edit', item);
    },
    deleteItem(item) {
      this.$emit('delete', item);
    }
  }
};
</script>
