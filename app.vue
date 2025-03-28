<template>
    <UApp>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>

<script setup>
import { useTheme } from "~/composables/useTheme";
import { onMounted } from "vue";

const { setTheme, theme } = useTheme();
onMounted(() => {
    setTheme(theme.value);
    document.documentElement.classList.remove("initially-hidden");
    document.body.classList.add("content-visible");
});
</script>

<style></style>
