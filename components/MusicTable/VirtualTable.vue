<template>
  <div 
    ref="containerRef"
    class="virtual-table-container"
    @scroll="onScroll"
  >
    <div
      class="virtual-table-content"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        class="virtual-table-items"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <slot
          v-for="item in visibleItems"
          :key="item.index"
          :item="item"
          :index="item.index"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

interface Props<T> {
  items: T[]
  itemHeight: number
  overscan?: number
}

const props = withDefaults(defineProps<Props<any>>(), {
  overscan: 5
})

const emit = defineEmits<{
  scroll: [event: Event]
}>()

const containerRef = ref<HTMLElement>()

const { list: visibleItems, containerProps, wrapperProps, scrollTo } = useVirtualList(
  props.items,
  {
    itemHeight: props.itemHeight,
    overscan: props.overscan
  }
)

const totalHeight = computed(() => props.items.length * props.itemHeight)
const offsetY = computed(() => {
  const transform = wrapperProps.value.style?.transform || '';
  return transform.match(/translateY\((\d+)px\)/)?.[1] || 0;
})

function onScroll(e: Event) {
  const target = e.target as HTMLElement
  if (typeof containerProps.onScroll === 'function') {
    containerProps.onScroll();
  }
  emit('scroll', e)
}

// Add type export
export interface VirtualTableInstance {
  scrollTo: (index: number) => void;
}

// Expose scroll methods
defineExpose({
  scrollTo: (index: number) => {
    // Implementation of scrollTo
    const container = containerRef.value
    if (container) {
      container.scrollTop = index * props.itemHeight
    }
  },
  containerRef
})
</script>

<style scoped>
.virtual-table-container {
  overflow-y: auto;
  position: relative;
  width: 100%;
  height: 100%;
}

.virtual-table-content {
  position: relative;
  width: 100%;
}

.virtual-table-items {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
</style>