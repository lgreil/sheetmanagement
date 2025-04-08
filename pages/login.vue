<template>
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <!-- Navigation -->
        <nav class="absolute top-0 left-0 right-0 p-4">
            <div class="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <div class="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <UIcon
                            name="i-heroicons-musical-note"
                            class="text-white h-5 w-5"
                        />
                    </div>
                    <span class="text-xl font-semibold text-gray-900 dark:text-white">Backweis</span>
                </div>
                <div class="flex items-center space-x-8">
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Concerts</a>
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Pieces</a>
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Instruments</a>
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">About</a>
                </div>
            </div>
        </nav>

        <!-- Login Form -->
        <div class="min-h-screen flex flex-col items-center justify-center px-6">
            <div class="w-full max-w-md">
                <!-- App Icon -->
                <div class="mb-8 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500 mb-6">
                        <UIcon
                            name="i-heroicons-musical-note-solid"
                            class="text-white text-2xl"
                        />
                    </div>
                    <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome Back
                    </h1>
                    <p class="text-gray-600 dark:text-gray-400">
                        Sign in to continue your musical journey
                    </p>
                </div>

                <!-- Card -->
                <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-8 shadow-xl">
                    <form @submit.prevent="handleLogin" class="space-y-6">
                        <!-- Email -->
                        <div>
                            <UInput
                                v-model="form.email"
                                type="email"
                                placeholder="Enter your email"
                                icon="i-heroicons-envelope"
                                size="lg"
                                :ui="{
                                    base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 pl-12 pr-4 py-3 text-base transition-all duration-200',
                                    leading: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
                                    leadingIcon: 'text-gray-400 dark:text-gray-500 h-5 w-5'
                                }"
                            />
                        </div>

                        <!-- Password -->
                        <div>
                            <UInput
                                v-model="form.password"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Enter your password"
                                icon="i-heroicons-lock-closed"
                                size="lg"
                                :ui="{
                                    base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 pl-12 pr-12 py-3 text-base transition-all duration-200',
                                    leading: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
                                    leadingIcon: 'text-gray-400 dark:text-gray-500 h-5 w-5'
                                }"
                            >
                                <template #trailing>
                                    <UButton
                                        color="neutral"
                                        variant="ghost"
                                        icon="i-heroicons-eye"
                                        @click="showPassword = !showPassword"
                                        class="absolute right-2 top-1/2 -translate-y-1/2"
                                    >
                                        <UIcon
                                            :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                                            class="text-gray-400 h-5 w-5"
                                        />
                                    </UButton>
                                </template>
                            </UInput>
                        </div>

                        <!-- Forgot Password -->
                        <div class="flex justify-end">
                            <UButton
                                color="neutral"
                                variant="link"
                                :to="{ name: 'forgot-password' }"
                                class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                Forgot password?
                            </UButton>
                        </div>

                        <!-- Sign In Button -->
                        <UButton
                            type="submit"
                            block
                            size="lg"
                            :loading="loading"
                            class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3 text-base font-medium transition-all duration-200"
                        >
                            <span class="flex items-center justify-center">
                                Sign in
                                <UIcon name="i-heroicons-arrow-right" class="ml-2 h-5 w-5" />
                            </span>
                        </UButton>

                        <!-- Sign Up Link -->
                        <div class="text-center mt-6">
                            <p class="text-gray-600 dark:text-gray-400">
                                Don't have an account?
                                <UButton
                                    color="neutral"
                                    variant="link"
                                    :to="{ name: 'register' }"
                                    class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                                >
                                    Sign up
                                </UButton>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useAuth } from "~/composables/useAuth";
import { useRouter } from "vue-router";

definePageMeta({
    layout: "default",
});

const router = useRouter();
const loading = ref(false);
const errors = ref({
    email: "",
    password: "",
});
const showPassword = ref(false);
const rememberMe = ref(false);
const currentQuote = ref("");

// Function to get a random quote
async function getRandomQuote() {
    try {
        const response = await fetch('/data/quotes.txt');
        const text = await response.text();
        const quoteLines = text.split('\n').filter(line => line.trim());
        const randomIndex = Math.floor(Math.random() * quoteLines.length);
        return quoteLines[randomIndex];
    } catch (error) {
        console.error('Error loading quotes:', error);
        return "Music is the divine way to tell beautiful, poetic things to the heart.";
    }
}

// Replace watchEffect with onMounted to avoid SSR issues
onMounted(async () => {
    if (isAuthenticated.value) {
        navigateTo("/");
    }
    // Set initial random quote
    currentQuote.value = await getRandomQuote();
});

const auth = useAuth();
const { login, isAuthenticated } = auth;

const form = reactive({
    email: "",
    password: "",
});

async function handleLogin() {
    try {
        loading.value = true;
        errors.value = { email: "", password: "" };
        await login(form);
        // Use navigateTo instead of router.push for better SSR handling
        await navigateTo("/profile");
    } catch (error) {
        errors.value.email = "Invalid credentials";
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.min-h-screen {
    animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

/* Custom scrollbar */
::-webkit-scrollbar {
    width: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}

/* Dark mode scrollbar */
.dark ::-webkit-scrollbar-thumb {
    background: #475569;
}

.dark ::-webkit-scrollbar-thumb:hover {
    background: #64748b;
}
</style>
