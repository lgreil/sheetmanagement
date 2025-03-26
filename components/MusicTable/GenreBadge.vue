<template>
  <UTooltip :text="tooltipText">
    <span :class="[
      'genre-badge',
      `genre-badge-${normalizedGenre}`
    ]">
      {{ displayText }}
    </span>
  </UTooltip>
</template>

<script setup lang="ts">
import type { GenreType } from '~/types/table'

interface Props {
  genre: GenreType
}

const props = defineProps<Props>()

const normalizedGenre = computed(() => props.genre.toLowerCase() as GenreType)

const displayText = computed(() => {
  const translations: Record<GenreType, string> = {
    'traditionell': 'Traditionell',
    'klassik': 'Klassik',
    'barock': 'Barock',
    'moderne-klassik': 'Moderne Klassik',
    'romantik': 'Romantik',
    'musicals': 'Musicals',
    'pop-rock-modern': 'Pop/Rock/Modern',
    'weihnachtsmusik': 'Weihnachtsmusik',
    'filmmusik': 'Filmmusik'
  }
  return translations[normalizedGenre.value] || props.genre
})

const tooltipText = computed(() => `Genre: ${displayText.value}`)
</script>