<template>
  <div class="music-search-input flex items-center">
    <div class="flex-shrink-0 mr-3">
      <UIcon
        name="i-heroicons-magnifying-glass"
        class="text-white/70 w-5 h-5"
      />
    </div>
    <input
      v-model="searchModelValue"
      placeholder="Search across all columns (name, genre, composer, arranger, etc.)"
      class="w-full"
    />
    <UButton
      v-if="searchModelValue"
      icon="i-heroicons-x-mark"
      variant="ghost"
      color="white"
      class="ml-2 opacity-70 hover:opacity-100"
      @click="clearSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { useState } from "#app";

const searchModelValue = useState("searchModelValue", () => "");

function clearSearch() {
  searchModelValue.value = "";
}
</script>

<style scoped>
.music-search-input {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(30, 58, 138, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  transition: all 0.2s;
  color: white;
  width: 100%;
}
.music-search-input:focus-within {
  background-color: rgba(255, 255, 255, 0.15);
  border-color: rgba(59, 130, 246, 0.5);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
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
</style>
