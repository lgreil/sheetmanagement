<template>
  <tr 
    :class="[
      'music-table-row',
      selected && 'bg-blue-900 bg-opacity-20',
      focused && 'ring-2 ring-blue-500'
    ]"
    :tabindex="tabindex"
    @click="$emit('select', item)"
    @focus="focused = true"
    @blur="focused = false"
  >
    <td v-for="column in columns" :key="column.key" class="p-3">
      <div v-if="column.component">
      <component
        :is="column.component"
        v-bind="getRenderProps(column)"
      />
      </div>
      <div v-else>
      {{ getValue(column) }}
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">

import type { TableColumn } from '@nuxt/ui'
import type { Piece } from '~/types/Types'

interface Props {
  item: Piece
  columns: TableColumn<Piece>[]
  selected?: boolean
  tabindex?: number
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  tabindex: 0
})

defineEmits<{
  select: [item: Piece]
}>()

const focused = ref(false)

function getValue(column: TableColumn<Piece>) {
  const key = (column as any).key; // Temporary cast if 'key' is not in the type
  return typeof key === 'string' && key in props.item ? props.item[key as keyof Piece] : ''
}

function getRenderProps(column: TableColumn<Piece>) {
  return {
    row: props.item,
    column,
    value: getValue(column)
  }
}
</script>

<style scoped>
.music-table-row {
  transition: all 200ms;
  transition-duration: 200ms;
}

.music-table-row:focus {
  outline: none;
}

.music-table-row:hover {
  background-color: rgba(30, 58, 138, 0.1);
}
</style>