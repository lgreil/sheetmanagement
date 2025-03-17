<template>
    <UTooltip :text="`Difficulty: ${difficulty}`">
        <div class="relative h-5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
            :aria-valuenow="difficultyPercentage" aria-valuemin="0" aria-valuemax="100" role="progressbar">
            <div class="h-full transition-all" :class="difficultyClass" :style="{ width: `${difficultyPercentage}%` }">
            </div>
            <span class="absolute inset-0 flex items-center justify-center text-xs font-semibold"
                :class="difficultyPercentage > 50 ? 'text-white' : 'text-gray-800 dark:text-gray-200'">
                {{ difficulty }}
            </span>
        </div>
    </UTooltip>
</template>

<script setup lang="ts">
import { UTooltip } from '#components'
import { computed } from 'vue'

const props = defineProps<{
    difficulty: string
}>()

const difficultyPercentage = computed(() => {
    switch (props.difficulty) {
        case 'easy': return 25
        case 'medium': return 50
        case 'hard': return 75
        case 'very hard': return 100
        default: return 0
    }
})

const difficultyClass = computed(() => {
    switch (props.difficulty) {
        case 'easy': return 'bg-emerald-500 dark:bg-emerald-600'
        case 'medium': return 'bg-amber-500 dark:bg-amber-600'
        case 'hard': return 'bg-rose-500 dark:bg-rose-600'
        case 'very hard': return 'bg-red-700 dark:bg-red-800'
        case 'Unknown':
        default: return 'bg-gray-400 dark:bg-gray-600'
    }
})
</script>

<style>
/* Difficulty badge styling */
.difficulty-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.difficulty-badge.unknown {
  background-color: rgba(107, 114, 128, 0.5);
  color: white;
}

.difficulty-badge.medium {
  background-image: linear-gradient(to right, #f59e0b, #ea580c);
  color: white;
}
</style>