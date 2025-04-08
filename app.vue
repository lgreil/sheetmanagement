<script setup lang="ts">
import { useTheme } from "~/composables/useTheme";
import * as locales from '@nuxt/ui/locale'
import { onMounted } from "vue";

const { setTheme, theme } = useTheme();
const { locale } = useI18n();

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

useHead({
    htmlAttrs: {
        lang,
        dir
    }
})

onMounted(() => {
    setTheme(theme.value);
    document.documentElement.classList.remove("initially-hidden");
    document.body.classList.add("content-visible");
});
</script>

<template>
    <UApp :locale="locales[locale]">
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>

<style></style>
