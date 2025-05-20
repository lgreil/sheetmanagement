<template>
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <!-- Navigation -->
        <nav class="absolute top-0 left-0 right-0 p-6">
            <div class="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <UIcon
                            name="i-heroicons-musical-note"
                            class="text-white h-6 w-6"
                        />
                    </div>
                    <span class="text-2xl font-semibold text-gray-900 dark:text-white">Backweis</span>
                </div>
                <div class="flex items-center space-x-10">
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-lg">Concerts</a>
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-lg">Pieces</a>
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-lg">Instruments</a>
                    <a href="#" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-lg">About</a>
                </div>
            </div>
        </nav>

        <!-- Reset Password Form -->
        <div class="min-h-screen flex flex-col items-center justify-center px-8">
            <div class="w-full max-w-lg">
                <!-- App Icon -->
                <div class="mb-12 text-center">
                    <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500 mb-8 shadow-xl shadow-emerald-500/20">
                        <UIcon
                            name="i-heroicons-key"
                            class="text-white text-3xl"
                        />
                    </div>
                    <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Reset Password
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Enter your email to receive a reset link
                    </p>
                </div>

                <!-- Card -->
                <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
                    <form @submit.prevent="handleReset" class="space-y-8">
                        <!-- Email -->
                        <div>
                            <UInput
                                v-model="email"
                                type="email"
                                placeholder="Enter your email"
                                icon="i-heroicons-envelope"
                                size="lg"
                                :ui="{
                                    base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 pl-12 pr-4 py-4 text-base transition-all duration-200',
                                    leading: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
                                    leadingIcon: 'text-gray-400 dark:text-gray-500 h-5 w-5'
                                }"
                            />
                        </div>

                        <!-- Reset Button -->
                        <UButton
                            type="submit"
                            block
                            size="lg"
                            :loading="isLoading"
                            class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 text-lg font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                        >
                            <span class="flex items-center justify-center">
                                Send Reset Link
                                <UIcon name="i-heroicons-paper-airplane" class="ml-3 h-6 w-6" />
                            </span>
                        </UButton>

                        <!-- Back to Login -->
                        <div class="text-center pt-4">
                            <p class="text-base text-gray-600 dark:text-gray-400">
                                Remember your password?
                                <UButton
                                    color="neutral"
                                    variant="link"
                                    :to="{ name: 'login' }"
                                    class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium text-lg"
                                >
                                    Sign in
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
import { ref } from 'vue';

definePageMeta({
    layout: 'default',
});

const email = ref('');
const isLoading = ref(false);

const handleReset = async () => {
    isLoading.value = true;
    try {
        // TODO: Implement password reset logic
        console.log('Reset password for:', email.value);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('Password reset failed:', error);
    } finally {
        isLoading.value = false;
    }
};
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