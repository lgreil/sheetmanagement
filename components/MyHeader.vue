<template>
  <header class="bg-dark-color text-white shadow-md">
    <nav class="container mx-auto flex items-center justify-between p-4">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center space-x-2">
        <img src="/public/img/favicon.ico" alt="Logo" class="h-8 w-8" />
        <span class="text-xl font-semibold">Bachkreis</span>
      </NuxtLink>

      <!-- Navigation Links -->
      <ul class="hidden md:flex space-x-6">
        <li><NuxtLink to="/instrumente" class="hover:text-bachkreisgelb-hell">Instrumentenbestände</NuxtLink></li>
        <li><NuxtLink to="/stuecke" class="hover:text-bachkreisgelb-hell">Stücke</NuxtLink></li>
        <li><NuxtLink to="/about" class="hover:text-bachkreisgelb-hell">About</NuxtLink></li>
      </ul>
      <button id="theme-toggle" class="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded">
        <span id="theme-toggle-text">Toggle Dark Mode</span>
      </button>


      <!-- Mobile Menu Button -->
      <button @click="toggleMenu" class="md:hidden focus:outline-none">
        <Icon name="lucide:menu" class="w-6 h-6" />
      </button>

      <!-- Mobile Menu -->
      <div v-if="menuOpen" class="absolute top-16 left-0 w-full bg-dark-color p-4 md:hidden">
        <ul class="flex flex-col space-y-4">
          
          <li><NuxtLink to="/" class="hover:text-bachkreisgelb-hell" @click="closeMenu">Main</NuxtLink></li>
          <li><NuxtLink to="/instrumente" class="hover:text-bachkreisgelb-hell" @click="closeMenu">Instrumentenbestände</NuxtLink></li>
          <li><NuxtLink to="/stuecke" class="hover:text-bachkreisgelb-hell" @click="closeMenu">Stücke</NuxtLink></li>
          <li><NuxtLink to="/about" class="hover:text-bachkreisgelb-hell" @click="closeMenu">About</NuxtLink></li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue';

const menuOpen = ref(false);

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};


</script>

<style scoped>
.bg-dark-color {
  background-color: var(--dark-color);
}
</style>
