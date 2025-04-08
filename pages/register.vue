<template>
    <UContainer class="py-10">
        <div class="max-w-md mx-auto">
            <h1 class="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
                Create Account
            </h1>

            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-medium">
                            Sign up for a new account
                        </h2>
                        <UIcon name="i-heroicons-user-plus" class="text-gray-500" />
                    </div>
                </template>

                <form @submit.prevent="handleRegister" class="space-y-4">
                    <UFormGroup label="Name" name="name" required>
                        <UInput
                            v-model="name"
                            type="text"
                            placeholder="Full name"
                            icon="i-heroicons-user"
                        />
                    </UFormGroup>

                    <UFormGroup label="Email" name="email" required>
                        <UInput
                            v-model="email"
                            type="email"
                            placeholder="Email address"
                            icon="i-heroicons-envelope"
                        />
                    </UFormGroup>

                    <UFormGroup label="Password" name="password" required>
                        <UInput
                            v-model="password"
                            type="password"
                            placeholder="Password"
                            icon="i-heroicons-key"
                        />
                    </UFormGroup>

                    <UFormGroup label="Confirm Password" name="confirmPassword" required>
                        <UInput
                            v-model="confirmPassword"
                            type="password"
                            placeholder="Confirm password"
                            icon="i-heroicons-key"
                        />
                    </UFormGroup>

                    <UButton
                        type="submit"
                        color="primary"
                        block
                        :loading="isLoading"
                    >
                        Create Account
                    </UButton>
                </form>

                <template #footer>
                    <div class="text-center">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Already have an account?
                            <UButton
                                color="primary"
                                variant="link"
                                :to="{ name: 'login' }"
                            >
                                Sign in
                            </UButton>
                        </p>
                    </div>
                </template>
            </UCard>
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

definePageMeta({
    layout: 'default',
});

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);

const handleRegister = async () => {
    if (password.value !== confirmPassword.value) {
        // TODO: Show error message
        console.error('Passwords do not match');
        return;
    }

    isLoading.value = true;
    try {
        // TODO: Implement registration logic
        console.log('Registering user:', {
            name: name.value,
            email: email.value,
        });
    } catch (error) {
        console.error('Registration failed:', error);
    } finally {
        isLoading.value = false;
    }
};
</script> 