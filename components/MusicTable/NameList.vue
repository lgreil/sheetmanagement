<template>
  <div role="list" class="name-list">
    <div 
      v-for="(piece, index) in pieces"
      :key="piece.stid"
      role="listitem"
      :class="[
        'name-list-item',
        selectedIndex === index && 'selected'
      ]"
      :tabindex="index === selectedIndex ? 0 : -1"
      @click="selectItem(index)"
      @keydown="handleKeyDown($event, index)"
      :aria-selected="selectedIndex === index"
    >
      <div class="flex items-center gap-2">
        <span class="font-medium">{{ piece.name }}</span>
        <span class="text-sm text-gray-500 dark:text-gray-400">
            by {{ piece.komponiert.map(person => person.name).join(', ') }}
        </span>
      </div>
      <GenreBadge :genre="piece.genre" class="ml-auto" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Piece } from '~/types/Types'

defineProps<{
  pieces: Piece[]
}>()

const emit = defineEmits<{
  select: [piece: Piece]
}>()

const selectedIndex = ref(-1)
const { pieces } = defineProps<{ pieces: Piece[] }>()

function selectItem(index: number) {
  selectedIndex.value = index
  emit('select', pieces[index])
}

function handleKeyDown(event: KeyboardEvent, index: number) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (index < pieces.length - 1) {
        selectItem(index + 1)
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      if (index > 0) {
        selectItem(index - 1)
      }
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      selectItem(index)
      break
  }
}

// Reset selection when pieces change
watch(() => pieces, () => {
  selectedIndex.value = -1
})
</script>

<style scoped>
.name-list {
  border-top: 1px solid var(--tw-divide-gray-200);
  border-bottom: 1px solid var(--tw-divide-gray-200);
}

.dark .name-list {
  border-top: 1px solid var(--tw-divide-gray-700);
  border-bottom: 1px solid var(--tw-divide-gray-700);
}

.name-list-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-duration: 150ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.name-list-item:hover {
  background-color: var(--tw-bg-gray-50);
}

.dark .name-list-item:hover {
  background-color: var(--tw-bg-gray-800);
}

.name-list-item:focus {
  outline: none;
}

.name-list-item:focus-visible {
  box-shadow: 0 0 0 2px var(--tw-ring-blue-500);
  outline-offset: 2px;
}

.name-list-item:focus-visible {
  box-shadow: 0 0 0 2px var(--tw-ring-blue-500);
}

.name-list-item.selected {
  background-color: var(--tw-bg-blue-50);
}

.dark .name-list-item.selected {
  background-color: rgba(59, 130, 246, 0.2);
}
</style>
