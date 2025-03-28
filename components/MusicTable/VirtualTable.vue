<template>
  <div ref="scrollContainer" class="virtual-list-container" @scroll="handleScroll">
    <div :style="{ height: totalHeight + 'px', position: 'relative' }">
      <div v-for="(item, index) in visibleItems" :key="itemKey(item)" :style="getItemStyle(index)"
        class="virtual-list-item">
        <slot :item="item" :index="index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    default: 50
  }
})

const emit = defineEmits(['scroll'])

const scrollContainer = ref<HTMLElement | null>(null)
const startIndex = ref(0)

const visibleItemsCount = ref(10) // Adjust as needed

const totalHeight = computed(() => props.items.length * props.itemHeight)

const visibleItems = computed(() => {
  const end = Math.min(startIndex.value + visibleItemsCount.value, props.items.length)
  return props.items.slice(startIndex.value, end)
})

function handleScroll() {
  if (!scrollContainer.value) return

  const scrollTop = scrollContainer.value.scrollTop
  startIndex.value = Math.floor(scrollTop / props.itemHeight)
  emit('scroll', scrollTop)
}

function getItemStyle(index: number) {
  return {
    position: 'absolute',
    top: index * props.itemHeight + 'px',
    left: 0,
    width: '100%',
    height: props.itemHeight + 'px'
  }
}

function itemKey(item: any) {
  return item.id || item.stid || Math.random().toString(36)
}

defineExpose({
  scrollTo(index: number) {
    if (!scrollContainer.value) return
    scrollContainer.value.scrollTop = index * props.itemHeight
  }
})

watch(
  () => props.items.length,
  () => {
    nextTick(() => {
      handleScroll()
    })
  }
)
</script>

<style scoped>
.virtual-list-container {
  overflow-y: auto;
  position: relative;
}

.virtual-list-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>
