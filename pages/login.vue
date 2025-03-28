<template>
    <div
        class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out"
        :style="{ backgroundColor: 'var(--color-background)' }"
    >
        <div
            class="max-w-md w-full space-y-8 backdrop-blur-sm bg-white/5 dark:bg-black/5 p-8 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all duration-300"
        >
            <div class="flex flex-col items-center">
                <div
                    class="w-16 h-16 mb-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex items-center justify-center"
                >
                    <Icon
                        name="heroicons:lock-closed"
                        class="text-white text-2xl"
                    />
                </div>
                <h2
                    class="text-center text-3xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent"
                >
                    Welcome Back
                </h2>
                <p
                    class="mt-2 text-center text-sm"
                    :style="{ color: 'var(--color-muted-text)' }"
                >
                    Sign in to access your account
                </p>
            </div>
            <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
                <div class="rounded-lg space-y-5">
                    <UFormGroup label="Email" name="email">
                        <UInput
                            v-model="form.email"
                            type="email"
                            required
                            placeholder="Email address"
                            :error="errors.email"
                            icon="heroicons:envelope"
                            class="transition-all duration-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                        />
                    </UFormGroup>
                    <UFormGroup label="Password" name="password">
                        <UInput
                            v-model="form.password"
                            :type="showPassword ? 'text' : 'password'"
                            required
                            placeholder="Password"
                            :error="errors.password"
                            icon="heroicons:lock-closed"
                            class="transition-all duration-200 hover:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                        >
                            <template #trailing>
                                <button
                                    type="button"
                                    @click="showPassword = !showPassword"
                                    class="text-gray-400 hover:text-gray-600 focus:outline-none"
                                >
                                    <Icon
                                        :name="
                                            showPassword
                                                ? 'heroicons:eye-slash'
                                                : 'heroicons:eye'
                                        "
                                        class="h-5 w-5"
                                    />
                                </button>
                            </template>
                        </UInput>
                    </UFormGroup>
                </div>

                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <input
                            id="remember-me"
                            type="checkbox"
                            class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                        />
                        <label
                            for="remember-me"
                            class="ml-2 block text-sm"
                            :style="{ color: 'var(--color-muted-text)' }"
                            >Remember me</label
                        >
                    </div>
                    <div class="text-sm">
                        <a
                            href="#"
                            class="font-medium hover:underline"
                            :style="{ color: 'var(--color-highlight)' }"
                            >Forgot password?</a
                        >
                    </div>
                </div>

                <div>
                    <UButton
                        type="submit"
                        block
                        :loading="loading"
                        color="primary"
                        class="py-3 rounded-md bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
                    >
                        Sign in
                    </UButton>
                </div>

                <div class="text-center mt-4">
                    <p
                        class="text-sm"
                        :style="{ color: 'var(--color-muted-text)' }"
                    >
                        Don't have an account?
                        <a
                            href="#"
                            class="font-medium ml-1 hover:underline"
                            :style="{ color: 'var(--color-highlight)' }"
                            >Sign up</a
                        >
                    </p>
                </div>

                <div class="relative my-6">
                    <div class="absolute inset-0 flex items-center">
                        <div
                            class="w-full border-t"
                            :style="{ borderColor: 'var(--color-border)' }"
                        ></div>
                    </div>
                    <div class="relative flex justify-center text-sm">
                        <span
                            class="px-2"
                            :style="{
                                backgroundColor: 'var(--color-background)',
                                color: 'var(--color-muted-text)',
                            }"
                            >Or continue with</span
                        >
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <button
                        type="button"
                        class="inline-flex justify-center items-center py-2.5 border rounded-md shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                        :style="{ borderColor: 'var(--color-border)' }"
                    >
                        <Icon
                            name="mdi:google"
                            class="h-5 w-5"
                            :style="{ color: 'var(--color-text)' }"
                        />
                    </button>
                    <button
                        type="button"
                        class="inline-flex justify-center items-center py-2.5 border rounded-md shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                        :style="{ borderColor: 'var(--color-border)' }"
                    >
                        <Icon
                            name="mdi:github"
                            class="h-5 w-5"
                            :style="{ color: 'var(--color-text)' }"
                        />
                    </button>
                    <button
                        type="button"
                        class="inline-flex justify-center items-center py-2.5 border rounded-md shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                        :style="{ borderColor: 'var(--color-border)' }"
                    >
                        <Icon
                            name="mdi:microsoft"
                            class="h-5 w-5"
                            :style="{ color: 'var(--color-text)' }"
                        />
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
import { useAuth } from "~/composables/useAuth";

definePageMeta({
    layout: "default",
});

const loading = ref(false);
const errors = ref({
    email: "",
    password: "",
});
const showPassword = ref(false);

const auth = useAuth();
const { login, isAuthenticated } = auth;

// Redirect if already authenticated
watchEffect(() => {
    if (isAuthenticated.value) {
        navigateTo("/");
    }
});

const form = reactive({
    email: "",
    password: "",
});

async function handleSubmit() {
    try {
        loading.value = true;
        errors.value = { email: "", password: "" };
        await login(form);
    } catch (error) {
        errors.value.email = "Invalid credentials";
    } finally {
        loading.value = false;
    }
}
</script>

<style>
/* Animation Effects */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.min-h-screen {
    animation: fadeIn 0.6s ease-out;
}
</style>
