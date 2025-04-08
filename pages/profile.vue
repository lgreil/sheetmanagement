<template>
    <UContainer class="py-10">
        <div class="max-w-4xl mx-auto">
            <h1
                class="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100"
            >
                My Profile
            </h1>

            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-medium">
                            Personal Information
                        </h2>
                        <UIcon
                            name="i-heroicons-user-circle"
                            class="text-gray-500"
                        />
                    </div>
                </template>

                <div class="grid md:grid-cols-2 gap-6">
                    <UFormGroup
                        label="First Name"
                        name="firstName"
                    >
                        <UInput
                            v-model="user.firstName"
                            placeholder="Enter your first name"
                        />
                    </UFormGroup>

                    <UFormGroup
                        label="Last Name"
                        name="lastName"
                    >
                        <UInput
                            v-model="user.lastName"
                            placeholder="Enter your last name"
                        />
                    </UFormGroup>

                    <UFormGroup
                        label="Email"
                        name="email"
                    >
                        <UInput
                            v-model="user.email"
                            type="email"
                            placeholder="Enter your email"
                        />
                    </UFormGroup>

                    <UFormGroup
                        label="Phone"
                        name="phone"
                    >
                        <UInput
                            v-model="user.phone"
                            placeholder="Enter your phone number"
                        />
                    </UFormGroup>
                </div>

                <template #footer>
                    <div class="flex justify-end">
                        <UButton
                            color="primary"
                            :loading="isLoading"
                            @click="handleSave"
                        >
                            Save
                        </UButton>
                    </div>
                </template>
            </UCard>

            <UCard class="mt-6">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-medium">
                            Change Password
                        </h2>
                        <UIcon
                            name="i-heroicons-key"
                            class="text-gray-500"
                        />
                    </div>
                </template>

                <div class="space-y-4">
                    <UFormGroup
                        label="Current Password"
                        name="currentPassword"
                    >
                        <UInput
                            v-model="password.current"
                            type="password"
                            placeholder="Enter your current password"
                        />
                    </UFormGroup>

                    <UFormGroup
                        label="New Password"
                        name="newPassword"
                    >
                        <UInput
                            v-model="password.new"
                            type="password"
                            placeholder="Enter your new password"
                        />
                    </UFormGroup>

                    <UFormGroup
                        label="Confirm Password"
                        name="confirmPassword"
                    >
                        <UInput
                            v-model="password.confirm"
                            type="password"
                            placeholder="Confirm your new password"
                        />
                    </UFormGroup>
                </div>

                <template #footer>
                    <div class="flex justify-end">
                        <UButton
                            color="primary"
                            :loading="isLoading"
                            @click="handleChangePassword"
                        >
                            Update Password
                        </UButton>
                    </div>
                </template>
            </UCard>

            <UCard class="mt-6">
                <template #header>
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-medium">
                            Preferences
                        </h2>
                        <UIcon
                            name="i-heroicons-cog-6-tooth"
                            class="text-gray-500"
                        />
                    </div>
                </template>

                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-medium">
                                Notifications
                            </h3>
                            <p class="text-sm text-gray-500">
                                Receive notifications about updates and events
                            </p>
                        </div>
                        <UToggle v-model="preferences.notifications" />
                    </div>

                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="font-medium">
                                Dark Mode
                            </h3>
                            <p class="text-sm text-gray-500">
                                Switch between light and dark theme
                            </p>
                        </div>
                        <UToggle v-model="preferences.darkMode" />
                    </div>
                </div>

                <template #footer>
                    <div class="flex justify-end">
                        <UButton
                            color="primary"
                            :loading="isLoading"
                            @click="handleSavePreferences"
                        >
                            Save Preferences
                        </UButton>
                    </div>
                </template>
            </UCard>
        </div>
    </UContainer>
</template>

<script setup>
import { ref } from "vue";

const isLoading = ref(false);

const user = ref({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
});

const password = ref({
    current: "",
    new: "",
    confirm: "",
});

const preferences = ref({
    notifications: true,
    darkMode: false,
});

const handleSave = async () => {
    isLoading.value = true;
    try {
        // Implement save logic here
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
        console.error("Save failed:", error);
    } finally {
        isLoading.value = false;
    }
};

const handleChangePassword = async () => {
    isLoading.value = true;
    try {
        // Implement password change logic here
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
        console.error("Password change failed:", error);
    } finally {
        isLoading.value = false;
    }
};

const handleSavePreferences = async () => {
    isLoading.value = true;
    try {
        // Implement preferences save logic here
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch (error) {
        console.error("Preferences save failed:", error);
    } finally {
        isLoading.value = false;
    }
};
</script>
