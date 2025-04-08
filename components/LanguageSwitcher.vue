<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const availableLocales = computed(() => {
  return (locales.value).filter(i => i.code !== locale.value)
})
</script>

<template>
  <UDropdown :items="availableLocales" :popper="{ placement: 'bottom-end' }">
    <UButton
      color="secondary"
      variant="ghost"
      :label="locale"
      trailing-icon="i-heroicons-language"
    />

    <template #item="{ item }">
      <NuxtLink :to="switchLocalePath(item.code)" class="w-full">
        <span class="truncate">{{ item.name }}</span>
      </NuxtLink>
    </template>
  </UDropdown>
</template> 