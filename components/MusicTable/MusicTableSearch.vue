<template>
  <div class="relative">
    <div
      class="music-search-input flex items-center"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    >
      <UIcon
        name="i-heroicons-magnifying-glass"
        class="flex-shrink-0 mr-3 text-white/70 w-5 h-5"
      />
      <UInput
        v-model="searchQuery"
        :disabled="disabled"
        :ui="{ 
          base: 'relative w-full bg-transparent border-none focus:ring-0'
        }"
        :class="'bg-transparent text-white placeholder-white/50'"
        placeholder="Search across all columns (name, genre, composer, arranger, etc.)"
        @update:modelValue="onSearchChange"
        @keydown.escape="clearSearch"
        @keydown.enter="onEnterPress"
      />
      <div class="flex items-center gap-2">
        <UButton
          v-if="searchQuery"
          icon="i-heroicons-x-mark"
          variant="ghost"
          color="primary"
          size="xs"
          :disabled="disabled"
          class="opacity-70 hover:opacity-100"
          @click="clearSearch"
          aria-label="Clear search"
        />
        <UTooltip v-if="!disabled" text="Press '/' to focus search">
          <kbd class="hidden md:inline-block px-2 py-1 text-xs font-medium text-white/50 bg-white/10 rounded">
            /
          </kbd>
        </UTooltip>
      </div>
    </div>

    <!-- Error Message -->
    <TransitionRoot
      :show="!!error"
      enter="transition ease-out duration-200"
      enter-from="opacity-0 -translate-y-1"
      enter-to="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leave-from="opacity-100 translate-y-0"
      leave-to="opacity-0 -translate-y-1"
    >
      <p v-if="error" class="absolute left-0 right-0 mt-2 text-sm text-red-400" role="alert">
        {{ error }}
      </p>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { useDebounce } from '@vueuse/core'
import { TransitionRoot } from '@headlessui/vue'

interface Props {
  modelValue?: string
  disabled?: boolean
  minLength?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false,
  minLength: 2
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [value: string]
}>()

const searchQuery = ref(props.modelValue)
const error = ref<string | null>(null)

// Debounce the search to avoid too many updates
const onSearchChange = useDebounce<(value: string) => void>((value: string) => {
  validateAndEmit(value)
}, 300)

function validateAndEmit(value: string) {
  error.value = null
  
  if (value && value.length < props.minLength) {
    error.value = `Please enter at least ${props.minLength} characters`
    return
  }

  emit('update:modelValue', value)
  emit('search', value)
}

function clearSearch() {
  searchQuery.value = ''
  error.value = null
  emit('update:modelValue', '')
  emit('search', '')
}

function onEnterPress() {
  validateAndEmit(searchQuery.value)
}

// Global keyboard shortcut to focus search
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (
      e.key === '/' && 
      !props.disabled &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault()
      const input = document.querySelector('.music-search-input input')
      if (input instanceof HTMLElement) {
        input.focus()
      }
    }
  }

  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== searchQuery.value) {
    searchQuery.value = newValue
  }
})
</script>

<style scoped>
.music-search-input {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
  transition: all 0.2s;
  color: white;
  width: 100%;
}
.music-search-input:focus-within {
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
