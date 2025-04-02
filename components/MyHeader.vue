<template>
    <header
        class="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/60 transition-colors duration-300"
    >
        <div
            class="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6"
        >
            <div class="flex items-center gap-4">
                <NuxtLink
                    to="/"
                    class="flex items-center space-x-3 transition-transform hover:scale-105"
                    aria-label="Home"
                >
                    <img
                        src="~/assets/img/logo.png"
                        alt="Logo"
                        class="h-8 w-8 rounded-lg shadow-md"
                    />
                    <span
                        class="font-bold text-[var(--color-text)] text-lg tracking-tight"
                        >Bachkreis</span
                    >
                </NuxtLink>
                <nav class="hidden md:flex items-center space-x-6 ml-2">
                    <NuxtLink to="/concerts" class="nav-link"
                        >Concerts</NuxtLink
                    >
                    <NuxtLink to="/stuecke" class="nav-link">Stücke</NuxtLink>
                    <NuxtLink to="/instrumente" class="nav-link"
                        >Instrumente</NuxtLink
                    >
                    <NuxtLink to="/about" class="nav-link">About</NuxtLink>
                    <NuxtLink to="/contact" class="nav-link">Contact</NuxtLink>
                </nav>
            </div>

            <div class="flex items-center gap-4">
                <ColorModeButton class="transition-transform hover:scale-110" />

                <!-- Auth Section -->
                <template v-if="auth.isAuthenticated.value">
                    <div class="relative flex items-center">
                        <UButton
                            color="primary"
                            variant="ghost"
                            class="hover:bg-[var(--color-primary)]/10 text-sm min-w-[100px] font-medium"
                            @click="navigateTo('/profile')"
                        >
                            <Icon
                                name="heroicons:user-circle"
                                class="h-4 w-4 mr-2"
                            />
                            <span class="truncate">
                                {{
                                    auth.user.value?.name ||
                                    auth.user.value?.email
                                }}
                            </span>
                        </UButton>
                        <UButton
                            color="neutral"
                            variant="ghost"
                            class="hover:bg-[var(--color-background)] ml-1 rounded-full"
                            @click="auth.logout()"
                            aria-label="Sign out"
                        >
                            <Icon
                                name="heroicons:arrow-right-on-rectangle"
                                class="h-5 w-5 text-[var(--color-muted-text)]"
                            />
                        </UButton>
                    </div>
                </template>
                <template v-else>
                    <NuxtLink to="/login">
                        <UButton
                            color="primary"
                            class="shadow-sm hover:shadow-md transition-all duration-200 text-sm font-medium px-4 py-2"
                            >Sign in</UButton
                        >
                    </NuxtLink>
                </template>

                <!-- Mobile menu button -->
                <UButton
                    color="neutral"
                    variant="ghost"
                    class="md:hidden hover:bg-[var(--color-background)] transition-colors rounded-full"
                    @click="toggleMenu"
                    aria-label="Toggle menu"
                >
                    <Icon name="heroicons:bars-3" class="h-5 w-5" />
                </UButton>
            </div>
        </div>

        <!-- Mobile menu -->
        <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
        >
            <div v-if="menuOpen" class="md:hidden">
                <UCard
                    class="border-t mt-0 rounded-b-lg shadow-lg bg-[var(--color-surface)]"
                >
                    <nav class="px-4 py-3 space-y-1">
                        <NuxtLink to="/concerts" class="mobile-nav-link"
                            >Concerts</NuxtLink
                        >
                        <NuxtLink to="/stuecke" class="mobile-nav-link"
                            >Stücke</NuxtLink
                        >
                        <NuxtLink to="/instrumente" class="mobile-nav-link"
                            >Instrumente</NuxtLink
                        >
                        <NuxtLink to="/about" class="mobile-nav-link"
                            >About</NuxtLink
                        >
                        <NuxtLink to="/contact" class="mobile-nav-link"
                            >Contact</NuxtLink
                        >
                    </nav>
                </UCard>
            </div>
        </transition>
    </header>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

const { menuOpen, toggleMenu } = useMenu();
const auth = useAuth();

// This is kept for potential future use
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
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--color-muted-text);
    transition: color 200ms ease, transform 200ms ease;
    position: relative;
    padding: 0.5rem 0.25rem;
}

.nav-link:hover {
    color: var(--color-text);
    transform: translateY(-1px);
}

.nav-link::after {
    content: "";
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 100%;
    height: 2px;
    background-color: var(--color-primary);
    transform: scaleX(0);
    transition: transform 250ms ease;
    transform-origin: center;
    border-radius: 1px;
}

.nav-link:hover::after {
    transform: scaleX(0.8);
}

.router-link-active.nav-link {
    color: var(--color-primary);
}

.router-link-active.nav-link::after {
    transform: scaleX(0.8);
    background-color: var(--color-primary);
}

.mobile-nav-link {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    color: var(--color-muted-text);
    font-weight: 500;
    border-radius: 0.5rem;
    transition: all 200ms ease;
}

.mobile-nav-link:hover {
    background-color: var(--color-background);
    color: var(--color-primary);
    transform: translateX(4px);
}

.mobile-nav-link.router-link-active {
    background-color: var(--color-primary) / 10;
    color: var(--color-primary);
}
</style>
