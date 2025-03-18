<template>
    <div :class="[$colorMode.value, 'min-h-screen flex flex-col']">
        <MyHeader />
        <NuxtLoadingIndicator />
        <main class="flex-1 bg-[--bachkreisgelb-hell] dark:bg-gray-800 p-6">
            <slot />
        </main>

        <footer>
            <div>
                <p>
                    &copy; 2025 Bachkreis-Sheetmanagement. All rights reserved.
                </p>
                <div class="mt-2">
                    <NuxtLink
                        to="/about"
                        class="text-indigo-400 hover:text-indigo-600 transition-colors duration-200"
                        >About</NuxtLink
                    >
                    <span class="mx-2">|</span>
                    <NuxtLink
                        to="/contact"
                        class="text-indigo-400 hover:text-indigo-600 transition-colors duration-200"
                        >Contact</NuxtLink
                    >
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
// Access the color mode
const $colorMode = useColorMode();
console.log(colorMode.preference);
</script>

<style>
/* You can add global color mode styles here */
.dark body {
    background-color: #121212;
    color: #e0e0e0;
}

.light body {
    background-color: #ffffff;
    color: #121212;
}

body {
    background-color: #fff;
    color: rgba(0, 0, 0, 0.8);
}
.dark-mode body {
    background-color: #091a28;
    color: #ebf4f1;
}
.sepia-mode body {
    background-color: #f1e7d0;
    color: #433422;
}
</style>
