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

        <div class="container mx-auto px-8 py-32">
            <div class="max-w-5xl mx-auto">
                <!-- Profile Header -->
                <div class="text-center mb-16">
                    <div class="inline-flex items-center justify-center w-28 h-28 rounded-2xl bg-emerald-500 mb-8 shadow-xl shadow-emerald-500/20">
                        <UIcon
                            name="i-heroicons-user-circle"
                            class="text-white text-5xl"
                        />
                    </div>
                    <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        My Profile
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Manage your account settings and preferences
                    </p>
                </div>

                <!-- Profile Content -->
                <div class="grid md:grid-cols-2 gap-10">
                    <!-- Personal Information -->
                    <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
                        <div class="flex items-center justify-between mb-8">
                            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                                Personal Information
                            </h2>
                            <UIcon
                                name="i-heroicons-user-circle"
                                class="text-emerald-500 h-8 w-8"
                            />
                        </div>

                        <div class="space-y-8">
                            <div>
                                <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    First Name
                                </label>
                                <UInput
                                    v-model="user.firstName"
                                    placeholder="Enter your first name"
                                    :ui="{
                                        base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                    }"
                                />
                            </div>

                            <div>
                                <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Last Name
                                </label>
                                <UInput
                                    v-model="user.lastName"
                                    placeholder="Enter your last name"
                                    :ui="{
                                        base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                    }"
                                />
                            </div>

                            <div>
                                <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Email
                                </label>
                                <UInput
                                    v-model="user.email"
                                    type="email"
                                    placeholder="Enter your email"
                                    :ui="{
                                        base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                    }"
                                />
                            </div>

                            <div>
                                <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    Phone
                                </label>
                                <UInput
                                    v-model="user.phone"
                                    placeholder="Enter your phone number"
                                    :ui="{
                                        base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                    }"
                                />
                            </div>

                            <UButton
                                color="primary"
                                block
                                :loading="isLoading"
                                @click="handleSave"
                                class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 text-lg font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                            >
                                Save Changes
                            </UButton>
                        </div>
                    </div>

                    <!-- Password & Preferences -->
                    <div class="space-y-10">
                        <!-- Change Password -->
                        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
                            <div class="flex items-center justify-between mb-8">
                                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                                    Change Password
                                </h2>
                                <UIcon
                                    name="i-heroicons-key"
                                    class="text-emerald-500 h-8 w-8"
                                />
                            </div>

                            <div class="space-y-8">
                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Current Password
                                    </label>
                                    <UInput
                                        v-model="password.current"
                                        type="password"
                                        placeholder="Enter your current password"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                </div>

                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        New Password
                                    </label>
                                    <UInput
                                        v-model="password.new"
                                        type="password"
                                        placeholder="Enter your new password"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                </div>

                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Confirm Password
                                    </label>
                                    <UInput
                                        v-model="password.confirm"
                                        type="password"
                                        placeholder="Confirm your new password"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                </div>

                                <UButton
                                    color="primary"
                                    block
                                    :loading="isLoading"
                                    @click="handleChangePassword"
                                    class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 text-lg font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                                >
                                    Update Password
                                </UButton>
                            </div>
                        </div>

                        <!-- Preferences -->
                        <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
                            <div class="flex items-center justify-between mb-8">
                                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                                    Preferences
                                </h2>
                                <UIcon
                                    name="i-heroicons-cog-6-tooth"
                                    class="text-emerald-500 h-8 w-8"
                                />
                            </div>

                            <div class="space-y-8">
                                <div class="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-200">
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                                            Email Notifications
                                        </h3>
                                        <p class="text-base text-gray-500 dark:text-gray-400">
                                            Receive updates about your account
                                        </p>
                                    </div>
                                    <button
                                        @click="preferences.notifications = !preferences.notifications"
                                        class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        :class="preferences.notifications ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'"
                                    >
                                        <span
                                            class="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out"
                                            :class="preferences.notifications ? 'translate-x-7' : 'translate-x-1'"
                                        />
                                    </button>
                                </div>

                                <div class="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-gray-900/50 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-all duration-200">
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                                            Dark Mode
                                        </h3>
                                        <p class="text-base text-gray-500 dark:text-gray-400">
                                            Switch between light and dark theme
                                        </p>
                                    </div>
                                    <button
                                        @click="preferences.darkMode = !preferences.darkMode"
                                        class="relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        :class="preferences.darkMode ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'"
                                    >
                                        <span
                                            class="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out"
                                            :class="preferences.darkMode ? 'translate-x-7' : 'translate-x-1'"
                                        />
                                    </button>
                                </div>

                                <UButton
                                    color="primary"
                                    block
                                    :loading="isLoading"
                                    @click="handleSavePreferences"
                                    class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 text-lg font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                                >
                                    Save Preferences
                                </UButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useColorMode } from "#imports";

const colorMode = useColorMode();
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
    darkMode: colorMode.value === 'dark',
});

// Watch for changes in the dark mode preference
watch(() => preferences.value.darkMode, (newValue) => {
    colorMode.preference = newValue ? 'dark' : 'light';
});

// Watch for changes in the system color mode
watch(() => colorMode.value, (newValue) => {
    preferences.value.darkMode = newValue === 'dark';
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
