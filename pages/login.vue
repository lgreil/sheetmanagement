<template>
    <UContainer class="py-10">
        <div class="max-w-md mx-auto">
            <h1
                class="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100"
            >
                Welcome Back
            </h1>

            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-medium">
                            Sign in to access your account
                        </h2>
                        <UIcon
                            name="i-heroicons-lock-closed"
                            class="text-gray-500"
                        />
                    </div>
                </template>

                <form @submit.prevent="handleLogin" class="space-y-4">
                    <UFormGroup
                        label="Email"
                        name="email"
                        required
                    >
                        <UInput
                            v-model="email"
                            type="email"
                            placeholder="Email address"
                            icon="i-heroicons-envelope"
                        />
                    </UFormGroup>

                    <UFormGroup
                        label="Password"
                        name="password"
                        required
                    >
                        <UInput
                            v-model="password"
                            type="password"
                            placeholder="Password"
                            icon="i-heroicons-key"
                        />
                    </UFormGroup>

                    <div class="flex items-center justify-between">
                        <UToggle
                            v-model="rememberMe"
                            label="Remember me"
                        />
                        <UButton
                            color="gray"
                            variant="ghost"
                            :to="{ name: 'forgot-password' }"
                        >
                            Forgot password?
                        </UButton>
                    </div>

                    <UButton
                        type="submit"
                        color="primary"
                        block
                        :loading="isLoading"
                    >
                        Sign in
                    </UButton>
                </form>

                <template #footer>
                    <div class="text-center">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Don't have an account?
                            <UButton
                                color="primary"
                                variant="link"
                                :to="{ name: 'register' }"
                            >
                                Sign up
                            </UButton>
                        </p>
                    </div>
                </template>
            </UCard>
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { ref, reactive, watchEffect } from "vue";
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

async function handleLogin() {
    try {
        loading.value = true;
        errors.value = { email: "", password: "" };
        await login(form);
        router.push({ name: "profile" });
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
