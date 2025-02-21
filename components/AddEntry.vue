<template>
  <div>
    <button class="add" @click="addEntry">Add Entry</button>
  </div>
</template>

<script>
export default {
  name: 'AddEntry',
  methods: {
    addEntry() {
      // Emit an event to signal that this feature is not yet implemented
      this.$emit('add-entry-failure');
    }
  }
}
</script>

<style scoped>
.add {
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  font-size: 16px;
  cursor: pointer;
}
.add:hover {
  background-color: #45a049;
}
</style>
