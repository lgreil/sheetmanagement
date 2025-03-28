<template>
    <div class="min-h-screen flex flex-col font-sans">
        <MyHeader />
        <NuxtLoadingIndicator />
        <main class="flex-1 bg-[--color-surface] py-8">
            <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
                <slot />
            </div>
        </main>

        <footer class="bg-[--color-surface] py-4 mt-8">
            <div class="container mx-auto px-4 text-center">
                <div class="text-[--color-muted-text] text-sm">
                    <p class="opacity-80">
                        &copy; 2025 Bachkreis-Sheetmanagement. All rights
                        reserved.
                    </p>
                    <div class="mt-2">
                        <NuxtLink
                            to="/about"
                            class="text-[--color-primary] hover:opacity-80 transition-colors duration-200"
                            >About</NuxtLink
                        >
                        <span class="mx-2 opacity-50">|</span>
                        <NuxtLink
                            to="/contact"
                            class="text-[--color-primary] hover:opacity-80 transition-colors duration-200"
                            >Contact</NuxtLink
                        >
                    </div>
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
    background-color: var(--color-background);
    color: var(--color-text);
    font-family: "Inter", sans-serif; /* Apply font globally */
}
</style>
