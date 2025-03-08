<template>
  <div :class="[$colorMode.value, 'min-h-screen flex flex-col']">
    <MyHeader />
    <NuxtLoadingIndicator />
    <main class="flex-1 bg-[--bachkreisgelb-hell] dark:bg-gray-800 p-6">
      <slot />
    </main>

    <footer class="bg-[--dark-color] dark:bg-gray-900 text-white dark:text-gray-300 py-4">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p>&copy; 2025 Bachkreis-Sheetmanagement. All rights reserved.</p>
        <div class="mt-2">
          <NuxtLink to="/about" class="text-indigo-400 hover:text-indigo-600 transition-colors duration-200">About</NuxtLink>
          <span class="mx-2">|</span>
          <NuxtLink to="/contact" class="text-indigo-400 hover:text-indigo-600 transition-colors duration-200">Contact</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
// Access the color mode
const $colorMode = useColorMode();
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
</style>