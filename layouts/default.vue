<template>
    <div class="min-h-screen flex flex-col">
        <MyHeader />
        <NuxtLoadingIndicator />
        <main class="flex-1 bg-[--bachkreisgelb-hell] dark:bg-gray-800 p-6">
            <slot />
        </main>

        <footer class="text-center mt-6 py-4 bg-gray-100 dark:bg-gray-900">
            <div class="text-gray-600 dark:text-gray-400 text-sm">
            <p class="opacity-80">
                &copy; 2025 Bachkreis-Sheetmanagement. All rights reserved.
            </p>
            <div class="mt-2">
                <NuxtLink
                to="/about"
                class="text-indigo-400 hover:text-indigo-600 transition-colors duration-200 opacity-80"
                >About</NuxtLink
                >
                <span class="mx-2 opacity-50">|</span>
                <NuxtLink
                to="/contact"
                class="text-indigo-400 hover:text-indigo-600 transition-colors duration-200 opacity-80"
                >Contact</NuxtLink
                >
            </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
// Color mode is handled automatically by Nuxt
</script>

<style>
:root {
    color-scheme: light dark;
}

body {
    background-color: #fff;
    color: rgba(0, 0, 0, 0.8);
}

html.dark body {
    background-color: #121212;
    color: #e0e0e0;
}
</style>
