<template>
    <UContainer class="py-10">
        <div class="max-w-5xl mx-auto">
            <h1
                class="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100"
            >
                Concerts & Termine
            </h1>

            <div class="grid md:grid-cols-4 gap-6">
                <UCard class="md:col-span-3">
                    <UCalendar
                        v-model="selectedDate"
                        :fixed-weeks="true"
                        class="rounded-lg shadow-sm"
                        color="primary"
                        :placeholder="selectedDate"
                        @update:placeholder="onPlaceholderUpdate"
                    >
                        <template #day="{ day }">
                            <div class="relative h-full">
                                <div class="absolute inset-0 flex items-center justify-center">
                                    {{ day.day }}
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 p-1">
                                    <template v-for="event in getEventsForDate(day)" :key="event.id">
                                        <div class="flex items-center gap-1 py-0.5 px-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                            @click="showEventDetails(event)">
                                            <UBadge :color="event.color" size="xs" />
                                            <span class="font-semibold text-xs truncate">{{ event.name }}</span>
                                            <span class="text-xs text-gray-500 dark:text-gray-400">
                                                {{ formatTime(event.time) }}
                                            </span>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </template>
                    </UCalendar>
                </UCard>

                <div class="md:col-span-1">
                    <UCard class="h-full">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h2 class="text-lg font-medium">
                                    Upcoming Events
                                </h2>
                                <UIcon
                                    name="i-heroicons-calendar"
                                    class="text-gray-500"
                                />
                            </div>
                        </template>
                        <div class="space-y-4">
                            <USeparator size="lg" />
                            <template v-if="upcomingEvents.length">
                                <div
                                    v-for="(event, index) in upcomingEvents"
                                    :key="event.id"
                                    class="py-2"
                                >
                                    <div class="flex items-center mb-1">
                                        <UBadge
                                            :color="event.color"
                                            size="xs"
                                            class="mr-2"
                                        />
                                        <p class="font-medium">
                                            {{ event.name }}
                                        </p>
                                    </div>
                                    <div class="flex flex-col ml-6 space-y-1">
                                        <div
                                            class="flex items-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            <UIcon
                                                name="i-heroicons-calendar-days"
                                                class="mr-1"
                                            />
                                            {{ formatDate(event.date) }}
                                        </div>
                                        <div
                                            class="flex items-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            <UIcon
                                                name="i-heroicons-clock"
                                                class="mr-1"
                                            />
                                            {{ formatTime(event.time) }}
                                        </div>
                                        <div v-if="event.location" class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <UIcon name="i-heroicons-map-pin" class="mr-1" />
                                            {{ event.location }}
                                        </div>
                                    </div>
                                    <USeparator
                                        v-if="index < upcomingEvents.length - 1"
                                        size="lg"
                                        class="mt-3"
                                    />
                                </div>
                            </template>
                            <div v-else class="py-4 text-center text-gray-500">
                                No upcoming events
                            </div>
                        </div>
                        <template #footer>
                            <UButton
                                color="primary"
                                variant="ghost"
                                block
                                class="mt-2"
                                @click="showAllEvents"
                            >
                                View All Events
                            </UButton>
                        </template>
                    </UCard>
                </div>
            </div>
        </div>

        <!-- Event Details Modal -->
        <UModal v-model="showEventModal">
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium">{{ selectedEvent?.name }}</h3>
                        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showEventModal = false" />
                    </div>
                </template>
                <div v-if="selectedEvent" class="space-y-4">
                    <div class="flex items-center text-gray-500 dark:text-gray-400">
                        <UIcon name="i-heroicons-calendar-days" class="mr-2" />
                        {{ formatDate(selectedEvent.date) }}
                    </div>
                    <div class="flex items-center text-gray-500 dark:text-gray-400">
                        <UIcon name="i-heroicons-clock" class="mr-2" />
                        {{ formatTime(selectedEvent.time) }}
                    </div>
                    <div v-if="selectedEvent.location" class="flex items-center text-gray-500 dark:text-gray-400">
                        <UIcon name="i-heroicons-map-pin" class="mr-2" />
                        {{ selectedEvent.location }}
                    </div>
                    <div v-if="selectedEvent.description" class="mt-4">
                        <h4 class="font-medium mb-2">Description</h4>
                        <p class="text-gray-600 dark:text-gray-300">{{ selectedEvent.description }}</p>
                    </div>
                </div>
            </UCard>
        </UModal>
    </UContainer>
</template>

<script setup>
import { ref, computed } from "vue";
import { format, isSameDay, addDays, isAfter, startOfDay } from "date-fns";

const selectedDate = ref(new Date());
const showEventModal = ref(false);
const selectedEvent = ref(null);

const colorTheme = {
    primary: "var(--color-primary)",
    accent: "var(--color-accent)",
    highlight: "var(--color-highlight)",
    warning: "var(--color-warning)",
    alert: "var(--color-alert)",
    background: "var(--color-surface)",
    text: "var(--color-text)",
};

// Event type definition
const eventTypes = {
    CONCERT: { color: "primary", icon: "i-heroicons-musical-note" },
    REHEARSAL: { color: "accent", icon: "i-heroicons-user-group" },
    MEETING: { color: "highlight", icon: "i-heroicons-chat-bubble-left-right" },
    OTHER: { color: "warning", icon: "i-heroicons-calendar" }
};

// Sample events (replace with actual data fetching)
const events = ref([
    {
        id: 1,
        date: new Date(2024, 6, 15),
        name: "Summer Concert",
        time: "19:30",
        location: "City Hall",
        description: "Annual summer concert featuring classical masterpieces",
        type: "CONCERT",
        color: eventTypes.CONCERT.color
    },
    {
        id: 2,
        date: new Date(2024, 7, 5),
        name: "Chamber Music Evening",
        time: "20:00",
        location: "Community Center",
        description: "Intimate chamber music performance",
        type: "CONCERT",
        color: eventTypes.CONCERT.color
    },
    {
        id: 3,
        date: new Date(2024, 7, 20),
        name: "Orchestral Rehearsal",
        time: "18:00",
        location: "Rehearsal Hall",
        description: "Weekly orchestra rehearsal",
        type: "REHEARSAL",
        color: eventTypes.REHEARSAL.color
    },
    {
        id: 4,
        date: new Date(2024, 8, 10),
        name: "Board Meeting",
        time: "21:00",
        location: "Conference Room",
        description: "Monthly board meeting to discuss upcoming events",
        type: "MEETING",
        color: eventTypes.MEETING.color
    },
    {
        id: 5,
        date: new Date(2024, 8, 25),
        name: "Classical Soirée",
        time: "19:00",
        location: "Grand Hall",
        description: "Elegant evening of classical music",
        type: "CONCERT",
        color: eventTypes.CONCERT.color
    }
]);

const upcomingEvents = computed(() => {
    const now = startOfDay(new Date());
    return events.value
        .filter(event => isAfter(event.date, now))
        .sort((a, b) => a.date - b.date)
        .slice(0, 5); // Show next 5 events
});

const formatTime = (timeString) => {
    return format(new Date(`2000-01-01T${timeString}`), "HH:mm");
};

const formatDate = (date) => {
    return format(date, "dd MMM yyyy");
};

const getEventsForDate = (day) => {
    return events.value.filter((event) => {
        const eventDate = new Date(event.date);
        const dayDate = new Date(day.year, day.month - 1, day.day);
        return isSameDay(eventDate, dayDate);
    });
};

const onPlaceholderUpdate = (date) => {
    selectedDate.value = date;
};

const showEventDetails = (event) => {
    selectedEvent.value = event;
    showEventModal.value = true;
};

const showAllEvents = () => {
    // Implement the logic to show all events in a list view
    // This could be a new route or a modal with a list view
    console.log("Show all events");
};
</script>

<style scoped>
.calendar-event {
    @apply text-xs truncate;
}

.calendar-event:hover {
    @apply bg-gray-100 dark:bg-gray-800;
}
</style>
