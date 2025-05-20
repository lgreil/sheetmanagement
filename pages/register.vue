<template>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-8 py-24">
        <div class="w-full max-w-2xl">
            <!-- Logo and Title -->
            <div class="text-center mb-16">
                <div class="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-emerald-500 mb-8 shadow-xl shadow-emerald-500/20">
                    <UIcon
                        name="i-heroicons-musical-note-solid"
                        class="text-white text-5xl"
                    />
                </div>
                <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                    Create Account
                </h1>
                <p class="text-xl text-gray-600 dark:text-gray-400">
                    Join our community of musicians
                </p>
            </div>

            <!-- Register Form -->
            <UCard class="backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 shadow-2xl border-0 overflow-hidden p-2">
                <div class="relative">
                    <!-- Decorative elements -->
                    <div class="absolute top-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full -translate-x-24 -translate-y-24"></div>
                    <div class="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full translate-x-24 translate-y-24"></div>

                    <form @submit.prevent="handleRegister" class="relative space-y-8 p-10">
                        <UFormGroup
                            label="Full Name"
                            name="name"
                            required
                            :error="errors.name"
                            class="mb-8"
                        >
                            <UInput
                                v-model="form.name"
                                type="text"
                                placeholder="Enter your full name"
                                icon="i-heroicons-user-solid"
                                size="lg"
                                :ui="{
                                    base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white/50 dark:bg-gray-900/50 pl-12 pr-4 py-4 text-base transition-all duration-200',
                                    leading: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
                                    leadingIcon: 'text-emerald-500 dark:text-emerald-400 h-5 w-5'
                                }"
                            />
                        </UFormGroup>

                        <UFormGroup
                            label="Email"
                            name="email"
                            required
                            :error="errors.email"
                            class="mb-8"
                        >
                            <UInput
                                v-model="form.email"
                                type="email"
                                placeholder="Enter your email"
                                icon="i-heroicons-envelope-solid"
                                size="lg"
                                :ui="{
                                    base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white/50 dark:bg-gray-900/50 pl-12 pr-4 py-4 text-base transition-all duration-200',
                                    leading: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
                                    leadingIcon: 'text-emerald-500 dark:text-emerald-400 h-5 w-5'
                                }"
                            />
                        </UFormGroup>

                        <UFormGroup
                            label="Password"
                            name="password"
                            required
                            :error="errors.password"
                            class="mb-8"
                        >
                            <UInput
                                v-model="form.password"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Create a password"
                                icon="i-heroicons-key-solid"
                                size="lg"
                                :ui="{
                                    base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white/50 dark:bg-gray-900/50 pl-12 pr-12 py-4 text-base transition-all duration-200',
                                    leading: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
                                    leadingIcon: 'text-emerald-500 dark:text-emerald-400 h-5 w-5'
                                }"
                            >
                                <template #trailing>
                                    <UButton
                                        color="neutral"
                                        variant="ghost"
                                        icon="i-heroicons-eye-solid"
                                        @click="showPassword = !showPassword"
                                        class="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                                    >
                                        <UIcon
                                            :name="showPassword ? 'i-heroicons-eye-slash-solid' : 'i-heroicons-eye-solid'"
                                            class="text-gray-500 h-5 w-5"
                                        />
                                    </UButton>
                                </template>
                            </UInput>
                        </UFormGroup>

                        <UFormGroup
                            label="Confirm Password"
                            name="confirmPassword"
                            required
                            :error="errors.confirmPassword"
                            class="mb-8"
                        >
                            <UInput
                                v-model="form.confirmPassword"
                                :type="showPassword ? 'text' : 'password'"
                                placeholder="Confirm your password"
                                icon="i-heroicons-key-solid"
                                size="lg"
                                :ui="{
                                    base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white/50 dark:bg-gray-900/50 pl-12 pr-4 py-4 text-base transition-all duration-200',
                                    leading: 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4',
                                    leadingIcon: 'text-emerald-500 dark:text-emerald-400 h-5 w-5'
                                }"
                            />
                        </UFormGroup>

                        <UButton
                            type="submit"
                            color="primary"
                            block
                            size="lg"
                            :loading="loading"
                            class="mt-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white dark:from-emerald-500 dark:to-emerald-400 dark:hover:from-emerald-600 dark:hover:to-emerald-500 transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-emerald-500/25 py-4 text-lg font-medium"
                        >
                            <template #leading>
                                <UIcon
                                    name="i-heroicons-user-plus-solid"
                                    class="w-6 h-6"
                                />
                            </template>
                            <span class="text-lg font-semibold">Create Account</span>
                        </UButton>

                        <div class="text-center mt-12">
                            <p class="text-base text-gray-600 dark:text-gray-400">
                                Already have an account?
                                <UButton
                                    color="primary"
                                    variant="link"
                                    :to="{ name: 'login' }"
                                    class="text-base font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                >
                                    Sign in
                                </UButton>
                            </p>
                        </div>
                    </form>
                </div>
            </UCard>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";

definePageMeta({
    layout: "default",
});

const router = useRouter();
const loading = ref(false);
const errors = ref({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
});
const showPassword = ref(false);

const form = reactive({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
});

async function handleRegister() {
    try {
        loading.value = true;
        errors.value = { name: "", email: "", password: "", confirmPassword: "" };

        if (form.password !== form.confirmPassword) {
            errors.value.confirmPassword = "Passwords do not match";
            return;
        }

        // TODO: Implement registration logic
        console.log('Registering user:', {
            name: form.name,
            email: form.email,
        });

        router.push({ name: "login" });
    } catch (error) {
        errors.value.email = "Registration failed";
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
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Custom scrollbar for the form */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}

/* Dark mode scrollbar */
.dark ::-webkit-scrollbar-track {
    background: #2d3748;
}

.dark ::-webkit-scrollbar-thumb {
    background: #4a5568;
}

.dark ::-webkit-scrollbar-thumb:hover {
    background: #718096;
}
</style> 