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
                            <div class="relative w-full h-full">
                                <div
                                    class="absolute inset-0 flex items-center justify-center"
                                >
                                    {{ day.day }}
                                </div>
                                <div class="absolute bottom-0 left-0 right-0">
                                    <template
                                        v-for="event in getEventsForDate(day)"
                                        :key="event.name"
                                    >
                                        <div
                                            class="flex items-center gap-2 py-1"
                                        >
                                            <UBadge
                                                :color="event.color"
                                                size="xs"
                                            />
                                            <span
                                                class="font-semibold text-xs truncate"
                                                >{{ event.name }}</span
                                            >
                                            <span
                                                class="text-xs text-gray-500 dark:text-gray-400"
                                            >
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
                                    :key="index"
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
    </UContainer>
</template>

<script setup>
import { ref, computed, defineComponent } from "vue";
import { format, isSameDay } from "date-fns";

const selectedDate = ref(new Date());

const colorTheme = {
    primary: "var(--color-primary)",
    accent: "var(--color-accent)",
    highlight: "var(--color-highlight)",
    warning: "var(--color-warning)",
    alert: "var(--color-alert)",
    background: "var(--color-surface)",
    text: "var(--color-text)",
};

const events = ref([
    {
        date: new Date(2024, 6, 15), // Months are 0-indexed in JavaScript Dates
        name: "Summer Concert",
        time: "19:30",
        color: "primary",
    },
    {
        date: new Date(2024, 7, 5),
        name: "Chamber Music Evening",
        time: "20:00",
        color: "accent",
    },
    {
        date: new Date(2024, 7, 20),
        name: "Orchestral Performance",
        time: "18:00",
        color: "highlight",
    },
    {
        date: new Date(2024, 8, 10),
        name: "Jazz Night",
        time: "21:00",
        color: "warning",
    },
    {
        date: new Date(2024, 8, 25),
        name: "Classical Soirée",
        time: "19:00",
        color: "alert",
    },
    // Add more events here
]);

const upcomingEvents = computed(() => {
    const now = new Date();
    return events.value
        .filter((event) => event.date > now)
        .sort((a, b) => a.date - b.date)
        .slice(0, 3);
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

const showAllEvents = () => {
    // Implement the logic to show all events
    console.log("Show all events");
};

defineComponent({
    name: "Concerts",
});
</script>
