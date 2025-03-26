<template>
    <UApp>
        <NuxtLayout>
            <NuxtPage />
        </NuxtLayout>
    </UApp>
</template>

<script setup>
onMounted(() => {
    document.documentElement.classList.remove('initially-hidden');
    document.body.classList.add('content-visible');
})
</script>

<style>
/* Initial state to prevent FOUC */
.initially-hidden { 
    visibility: hidden; 
}
body {
    opacity: 0;
    transition: opacity 0.1s ease;
}
body.content-visible {
    opacity: 1;
}

.page-enter-active,
.page-leave-active {
    transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
    opacity: 0;
    filter: blur(1rem);
}
</style>
