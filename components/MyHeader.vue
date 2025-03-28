<template>
    <header
        class="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60 transition-colors duration-200"
    >
        <div
            class="container mx-auto flex h-16 items-center justify-between px-4"
        >
            <div class="flex items-center gap-6">
                <NuxtLink
                    to="/"
                    class="flex items-center space-x-2 transition-transform hover:scale-105"
                >
                    <img
                        src="~/assets/img/logo.png"
                        alt="Logo"
                        class="h-8 w-8 rounded-lg shadow-sm"
                    />
                    <span class="font-bold text-gray-900 dark:text-white"
                        >Bachkreis</span
                    >
                </NuxtLink>
                <nav class="hidden md:flex items-center space-x-6">
                    <NuxtLink to="/stuecke" class="nav-link">Stücke</NuxtLink>
                    <NuxtLink to="/instrumente" class="nav-link"
                        >Instrumente</NuxtLink
                    >
                    <NuxtLink to="/about" class="nav-link">About</NuxtLink>
                    <NuxtLink to="/contact" class="nav-link">Contact</NuxtLink>
                </nav>
            </div>

            <div class="flex items-center gap-4">
                <ColorModeButton class="transition-transform hover:scale-105" />
                <!-- Theme Toggle button has been replaced with UColorModeButton above -->

                <!-- Auth Section -->
                <template v-if="auth.isAuthenticated.value">
                    <div class="relative">
                        <UButton
                            color="neutral"
                            variant="ghost"
                            class="hover:bg-gray-100 dark:hover:bg-gray-800"
                            @click="navigateTo('/profile')"
                        >
                            {{
                                auth.user.value?.name || auth.user.value?.email
                            }}
                        </UButton>
                        <UButton
                            color="neutral"
                            variant="ghost"
                            class="hover:bg-gray-100 dark:hover:bg-gray-800 ml-2"
                            @click="auth.logout()"
                        >
                            <Icon
                                name="heroicons:arrow-right-on-rectangle"
                                class="h-4 w-4"
                            />
                        </UButton>
                    </div>
                </template>
                <template v-else>
                    <NuxtLink to="/login">
                        <UButton
                            color="primary"
                            class="shadow-sm hover:shadow-md transition-all duration-200"
                            >Sign in</UButton
                        >
                    </NuxtLink>
                </template>

                <!-- Mobile menu button -->
                <UButton
                    color="neutral"
                    variant="ghost"
                    class="md:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    @click="toggleMenu"
                >
                    <Icon name="heroicons:bars-3" class="h-6 w-6" />
                </UButton>
            </div>
        </div>

        <!-- Mobile menu -->
        <div v-if="menuOpen" class="md:hidden">
            <nav
                class="border-t px-4 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur"
            >
                <NuxtLink to="/stuecke" class="mobile-nav-link"
                    >Stücke</NuxtLink
                >
                <NuxtLink to="/instrumente" class="mobile-nav-link"
                    >Instrumente</NuxtLink
                >
                <NuxtLink to="/about" class="mobile-nav-link">About</NuxtLink>
                <NuxtLink to="/contact" class="mobile-nav-link"
                    >Contact</NuxtLink
                >
            </nav>
        </div>
    </header>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

const { menuOpen, toggleMenu } = useMenu();
const auth = useAuth();

const userMenuItems = computed(() => [
    [
        {
            label: "Profile",
            icon: "heroicons:user",
            click: () => navigateTo("/profile"),
        },
        {
            label: "Settings",
            icon: "heroicons:cog-6-tooth",
            click: () => navigateTo("/settings"),
        },
    ],
    [
        {
            label: "Sign out",
            icon: "heroicons:arrow-right-on-rectangle",
            click: () => auth.logout(),
        },
    ],
]);
</script>

<style scoped>
.nav-link {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgb(75, 85, 99);
    transition-property: color;
    transition-duration: 200ms;
    position: relative;
}

.dark .nav-link {
    color: rgb(209, 213, 219);
}

.nav-link:hover {
    color: rgb(17, 24, 39);
}

.dark .nav-link:hover {
    color: rgb(255, 255, 255);
}

.nav-link::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 0.125rem;
    background-color: rgb(59, 130, 246);
    transform: scaleX(0);
    transition-property: transform;
    transition-duration: 200ms;
    transform-origin: left;
}

.nav-link:hover::after {
    transform: scaleX(1);
}

.mobile-nav-link {
    display: block;
    padding: 0.625rem 0.5rem;
    color: rgb(75, 85, 99);
    border-radius: 0.5rem;
    transition-property: color, background-color;
    transition-duration: 200ms;
}

.dark .mobile- .fade-enter-active,
.fade-leave-active {
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Ensure consistent font and alignment */
.font-sans {
    font-family: "Inter", sans-serif;
}
</style>
