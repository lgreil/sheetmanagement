<template>
    <UContainer class="py-10">
        <div class="max-w-md mx-auto">
            <h1 class="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100">
                Reset Password
            </h1>

            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-medium">
                            Enter your email to reset your password
                        </h2>
                        <UIcon name="i-heroicons-key" class="text-gray-500" />
                    </div>
                </template>

                <form @submit.prevent="handleReset" class="space-y-4">
                    <UFormGroup label="Email" name="email" required>
                        <UInput
                            v-model="email"
                            type="email"
                            placeholder="Email address"
                            icon="i-heroicons-envelope"
                        />
                    </UFormGroup>

                    <UButton
                        type="submit"
                        color="primary"
                        block
                        :loading="isLoading"
                    >
                        Send Reset Link
                    </UButton>
                </form>

                <template #footer>
                    <div class="text-center">
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Remember your password?
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

const email = ref('');
const isLoading = ref(false);

const handleReset = async () => {
    isLoading.value = true;
    try {
        // TODO: Implement password reset logic
        console.log('Reset password for:', email.value);
    } catch (error) {
        console.error('Password reset failed:', error);
    } finally {
        isLoading.value = false;
    }
};
</script> 