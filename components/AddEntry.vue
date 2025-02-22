<template>
  <div>
    <button
      @click="addEntry"
      class="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
    >
      Add Entry
    </button>
  </div>
</template>

<script>
export default {
  name: 'AddEntry',
  methods: {
    addEntry() {
      // Emit an event to signal that this feature is not yet implemented
      this.$emit('add-entry-failure');
    },
  },
};
</script>
