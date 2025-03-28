<template>
  <UTooltip :text="tooltipText">
    <div class="flex items-center gap-2">
      <span :class="[
        'digitized-indicator',
        isDigitized ? 'digitized-yes' : 'digitized-no'
      ]" :aria-label="ariaLabel" role="status" />
      <span v-if="showLabel" class="text-xs text-gray-600 dark:text-gray-400">
        {{ displayText }}
      </span>
    </div>
  </UTooltip>
</template>

<script setup lang="ts">
import { defineProps, computed, withDefaults } from 'vue';

interface Props {
  isDigitized: boolean
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false
})

const displayText = computed(() => 
  props.isDigitized ? 'Digital Available' : 'Print Only'
)

const tooltipText = computed(() => 
  props.isDigitized 
    ? 'Digital version is available for this piece' 
    : 'Only printed version available'
)

const ariaLabel = computed(() => 
  props.isDigitized 
    ? 'Digital version available' 
    : 'No digital version available'
)
</script>

<style scoped>
.digitized-indicator {
  display: inline-block;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
<<<<<<< HEAD
  transition: all;
}

.digitized-yes {
  background-color: rgb(16, 185, 129);
}

.digitized-no {
  background-color: rgb(156, 163, 175);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  70% {
    box-shadow: 0 0 6px 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

.digitized-yes {
  animation: pulse 2s infinite;
=======
}

.digitized-indicator.yes {
  background-color: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}

.digitized-indicator.no {
  background-color: #9ca3af;
>>>>>>> main
}
</style>
