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
      <component
        v-if="column.render"
        :is="column.render"
        v-bind="getRenderProps(column)"
      />
      <template v-else>
        {{ getValue(column) }}
      </template>
    </td>
  </tr>
</template>

<script setup lang="ts">

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
  return typeof column.key === 'string' ? props.item[column.key] : ''
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