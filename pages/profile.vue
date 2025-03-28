<template>
    <UContainer class="py-10">
        <h1
            class="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-500 to-pink-500 text-transparent bg-clip-text"
        >
            My Profile
        </h1>
        <UCard
            class="backdrop-blur-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
            <template #header>
                <div
                    class="flex flex-col md:flex-row items-center md:space-x-6 p-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
                >
                    <div class="relative">
                        <UImage
                            :src="
                                user.avatar || '/assets/img/default-profile.jpg'
                            "
                            width="80"
                            height="80"
                            class="rounded-full shadow-xl ring-2 ring-violet-500 dark:ring-violet-400 object-cover"
                        />
                        <span
                            class="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"
                        ></span>
                    </div>
                    <div class="text-center md:text-left mt-4 md:mt-0">
                        <h2 class="text-2xl font-bold">{{ user.name }}</h2>
                        <p
                            class="text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-start"
                        >
                            <UIcon name="i-heroicons-envelope" class="mr-2" />
                            {{ user.email }}
                        </p>
                        <div
                            class="flex space-x-2 mt-2 justify-center md:justify-start"
                        >
                            <UBadge color="emerald" variant="soft">{{
                                user.role
                            }}</UBadge>
                            <UBadge color="violet" variant="soft"
                                >{{ user.orchestras.length }} orchestras</UBadge
                            >
                        </div>
                    </div>
                </div>
            </template>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 p-2">
                <div class="col-span-1">
                    <div
                        class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full"
                    >
                        <h3
                            class="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 flex items-center"
                        >
                            <UIcon
                                name="i-heroicons-user-circle"
                                class="mr-2 text-indigo-500 dark:text-indigo-400"
                            />
                            Personal Information
                        </h3>
                        <div class="space-y-3">
                            <div>
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-200 block"
                                    >Name</span
                                >
                                <span
                                    class="text-gray-600 dark:text-gray-300"
                                    >{{ user.name }}</span
                                >
                            </div>
                            <div>
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-200 block"
                                    >Email</span
                                >
                                <span
                                    class="text-gray-600 dark:text-gray-300"
                                    >{{ user.email }}</span
                                >
                            </div>
                            <div>
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-200 block"
                                    >Location</span
                                >
                                <span
                                    class="text-gray-600 dark:text-gray-300 flex items-center"
                                >
                                    <UIcon
                                        name="i-heroicons-map-pin"
                                        class="mr-1 text-violet-500"
                                    />
                                    {{ user.location }}
                                </span>
                            </div>
                            <div>
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-200 block"
                                    >Member Since</span
                                >
                                <span
                                    class="text-gray-600 dark:text-gray-300"
                                    >{{ user.joinedDate }}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div
                        class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full"
                    >
                        <h3
                            class="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 flex items-center"
                        >
                            <UIcon
                                name="i-heroicons-user-group"
                                class="mr-2 text-pink-500 dark:text-pink-400"
                            />
                            Orchestra Memberships
                        </h3>
                        <div class="space-y-3">
                            <div
                                v-for="(orchestra, i) in user.orchestras"
                                :key="i"
                            >
                                <span
                                    class="font-medium text-gray-700 dark:text-gray-200 block"
                                    >{{ orchestra.name }}</span
                                >
                                <div class="flex items-center">
                                    <UBadge color="indigo" class="mt-1 mr-2">{{
                                        orchestra.role
                                    }}</UBadge>
                                    <span
                                        class="text-gray-600 dark:text-gray-300 text-sm"
                                    >
                                        Since {{ orchestra.joinedDate }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-span-1">
                    <div
                        class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-full"
                    >
                        <h3
                            class="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 flex items-center"
                        >
                            <UIcon
                                name="i-heroicons-musical-note"
                                class="mr-2 text-emerald-500 dark:text-emerald-400"
                            />
                            Sheet Music Activity
                        </h3>
                        <div class="space-y-2">
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-300"
                                    >Sheets Downloaded</span
                                >
                                <UBadge color="emerald">{{
                                    user.stats.sheetsDownloaded
                                }}</UBadge>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-300"
                                    >Collections Created</span
                                >
                                <UBadge color="amber">{{
                                    user.stats.collectionsCreated
                                }}</UBadge>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-gray-600 dark:text-gray-300"
                                    >Sheets Contributed</span
                                >
                                <UBadge color="violet">{{
                                    user.stats.sheetsContributed
                                }}</UBadge>
                            </div>
                        </div>
                        <div
                            class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                        >
                            <h4
                                class="font-medium text-gray-700 dark:text-gray-200 mb-2"
                            >
                                Recent Activity
                            </h4>
                            <div
                                v-for="(activity, i) in user.recentActivity"
                                :key="i"
                                class="text-sm text-gray-600 dark:text-gray-300 flex items-center py-1"
                            >
                                <UIcon
                                    :name="activity.icon"
                                    class="mr-2 text-indigo-500"
                                />
                                {{ activity.text }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-center md:justify-end space-x-3">
                    <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-pencil-square"
                        >Edit Profile</UButton
                    >
                    <UButton
                        color="indigo"
                        icon="i-heroicons-document-arrow-down"
                        >Download My Sheets</UButton
                    >
                </div>
            </template>
        </UCard>
    </UContainer>
</template>

<script setup>
import { ref } from "vue";

// Mock user data (replace with real data fetching later)
const user = ref({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://avatars.dicebear.com/api/male/john.svg", // Replace with your avatar source
    location: "Anytown, USA",
    joinedDate: "March 2022",
    role: "Conductor",
    orchestras: [
        {
            name: "Anytown Symphony Orchestra",
            role: "Lead Conductor",
            joinedDate: "June 2020",
        },
        {
            name: "Community Strings Ensemble",
            role: "Violinist",
            joinedDate: "January 2019",
        },
        {
            name: "Youth Orchestra Initiative",
            role: "Mentor",
            joinedDate: "September 2021",
        },
    ],
    instrument: "Violin/Conducting",
    stats: {
        sheetsDownloaded: 147,
        collectionsCreated: 8,
        sheetsContributed: 12,
    },
    recentActivity: [
        {
            text: "Uploaded 'Symphony No.5 - Violin I'",
            icon: "i-heroicons-document-plus",
        },
        {
            text: "Added scores to 'Spring Concert 2023'",
            icon: "i-heroicons-folder-plus",
        },
        {
            text: "Updated 'Brandenburg Concerto No.3'",
            icon: "i-heroicons-document-check",
        },
    ],
});
</script>
