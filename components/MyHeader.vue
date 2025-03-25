<template>
    <header class="bg-white dark:bg-gray-900 shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav class="flex items-center justify-between h-16">
                <!-- Logo -->
                <NuxtLink to="/" class="flex items-center">
                    <img
                        src="assets/img/logo.png"
                        alt="Logo"
                        class="h-10 w-10 mr-2 transition-transform duration-300 hover:scale-110"
                    />
                    <span
                        class="text-xl font-semibold text-gray-900 dark:text-white font-sans"
                        >Bachkreis</span
                    >
                </NuxtLink>

                <!-- Desktop Menu -->
                <div class="hidden md:flex space-x-8">
                    <NuxtLink
                        v-for="item in navigationItems"
                        :key="item.label"
                        :to="item.to"
                        class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 font-sans"
                        active-class="border-b-2 border-indigo-600 dark:border-indigo-400"
                    >
                        <Icon
                            :name="item.icon"
                            class="inline-block h-5 w-5 mr-1 align-middle"
                        />
                        <span class="align-middle">{{ item.label }}</span>
                    </NuxtLink>
                </div>

                <!-- Mobile Menu Button & Theme Toggle -->
                <div class="flex items-center">
                    <!-- Theme Toggle -->
                    <button
                        @click="toggleColorMode"
                        class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 focus:outline-none mr-4"
                        aria-label="Toggle Dark Mode"
                    >
                        <Icon
                            :name="
                                $colorMode.value === 'light'
                                    ? 'mdi:weather-night'
                                    : 'mdi:weather-sunny'
                            "
                            class="h-5 w-5"
                        />
                    </button>

                    <!-- Mobile Menu Button -->
                    <button
                        @click="toggleMenu"
                        class="md:hidden text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors duration-200 focus:outline-none"
                        aria-label="Open Mobile Menu"
                    >
                        <Icon name="mdi:menu" class="h-6 w-6" />
                    </button>
                </div>
            </nav>

            <!-- Mobile Menu -->
            <transition
                name="fade"
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
            >
                <div v-if="menuOpen" class="md:hidden">
                    <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NuxtLink
                            v-for="item in navigationItems"
                            :key="item.label"
                            :to="item.to"
                            class="block text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md px-3 py-2 text-base font-medium font-sans"
                            @click="closeMenu"
                        >
                            <Icon
                                :name="item.icon"
                                class="inline-block h-5 w-5 mr-2 align-middle"
                            />
                            <span class="align-middle">{{ item.label }}</span>
                        </NuxtLink>
                    </div>
                </div>
            </transition>
        </div>
    </header>
</template>

<script setup>
const $colorMode = useColorMode();
const { menuOpen, toggleMenu, closeMenu } = useMenu();

// Toggle between light and dark mode
function toggleColorMode() {
    $colorMode.preference = $colorMode.value === "dark" ? "light" : "dark";
}

// Navigation items
const navigationItems = [
    { label: "Instrumentenbestände", icon: "mdi:guitar-acoustic", to: "/instrumente" },
    { label: "Stücke", icon: "mdi:music-note", to: "/stuecke" },
    { label: "About", icon: "mdi:information-outline", to: "/about" },
];
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Ensure consistent font and alignment */
.font-sans {
    font-family: 'Inter', sans-serif;
}
</style>
