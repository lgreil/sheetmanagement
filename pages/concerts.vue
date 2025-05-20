<template>
    <UContainer class="py-10">
        <div class="max-w-5xl mx-auto">
            <div class="flex items-center justify-between mb-8">
                <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    Concerts & Termine
                </h1>
                <div class="flex gap-2">
                    <UButton
                        icon="i-heroicons-plus"
                        @click="showNewEventModal = true"
                    >
                        Add Event
                    </UButton>
                    <UDropdown :items="exportImportItems">
                        <UButton
                            icon="i-heroicons-ellipsis-vertical"
                            color="neutral"
                            variant="ghost"
                        />
                    </UDropdown>
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".json"
                        class="hidden"
                        @change="handleFileImport"
                    >
                </div>
            </div>
            <h1
                class="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-100"
            >
                Concerts & Termine
            </h1>

            <div class="grid md:grid-cols-4 gap-6">
                <UCard class="md:col-span-3">
                    <UCalendar
                        v-model="calendarDate as any"
                        :fixed-weeks="true"
                        class="rounded-lg shadow-sm"
                        color="primary"
                        @update:model-value="onPlaceholderUpdate"
                    >
                        <template #day="{ day }">
                            <div class="relative h-full">
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span>{{ day.day }}</span>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 p-1">
                                    <template v-for="event in getEventsForDate(day)" :key="event.id">
                                        <div class="flex items-center gap-1 py-0.5 px-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                                            @click="selectedEvent = event; showEditEventModal = true">
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
                                    <span>Upcoming Events</span>
                                </h2>
                                <UIcon
                                    name="i-heroicons-clock"
                                    class="mr-1"
                                    color="neutral"
                                />
                            </div>
                        </template>
                        <div class="space-y-4">
                            <USeparator size="lg" />
                            <template v-if="upcomingEvents.length">
                                <div
                                    v-for="event in upcomingEvents"
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
                                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <UIcon
                                                name="i-heroicons-clock"
                                                class="mr-1"
                                            />
                                            <span>{{ formatDate(event.date) }} {{ formatTime(event.time) }}</span>
                                            <span v-if="event.duration" class="ml-1">({{ event.duration }})</span>
                                        </div>
                                        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <UIcon
                                                name="i-heroicons-map-pin"
                                                class="mr-1"
                                            />
                                            <span>{{ event.location }}</span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <div v-else class="text-center text-gray-500 py-4">
                                No upcoming events
                            </div>
                        </div>
                    </UCard>
                </div>
            </div>
        </div>

        <!-- Event Modal -->
        <UModal v-model="showEditEventModal">
            <UCard>
                <template #header>
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-medium">
                            {{ selectedEvent ? 'Edit Event' : 'New Event' }}
                        </h3>
                        <UButton
                            color="neutral"
                            variant="ghost"
                            icon="i-heroicons-x-mark"
                            @click="showEditEventModal = false"
                        />
                    </div>
                </template>
                <!-- Event form content -->
            </UCard>
        </UModal>
    </UContainer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { Event as CalendarEvent, SerializableDate } from '~/types/events';

const { events, isLoading, fetchEvents, createEvent, updateEvent, deleteEvent, exportEvents, importEvents } = useEvents();

// Use Date for calendar
const selectedDate = useState<Date>('selectedDate', () => new Date());
const showNewEventModal = ref(false);
const showEditEventModal = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const calendarDate = computed({
    get: () => selectedDate.value,
    set: (date: Date | null) => {
        if (date && !(date instanceof Array)) {
            selectedDate.value = date;
        }
    }
});

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
    CONCERT: { color: "primary", icon: "i-heroicons-musical-note", priority: 1 },
    REHEARSAL: { color: "accent", icon: "i-heroicons-user-group", priority: 1 },
    BIRTHDAY: { color: "rose", icon: "i-heroicons-cake", priority: 2 },
    CELEBRATION: { color: "amber", icon: "i-heroicons-star", priority: 2 },
    VACATION: { color: "emerald", icon: "i-heroicons-sun", priority: 3 },
    SOCIAL: { color: "indigo", icon: "i-heroicons-users", priority: 2 },
    MISC: { color: "slate", icon: "i-heroicons-calendar", priority: 3 }
};

// Update the event type colors
const eventTypeColors = {
    concert: 'primary' as const,
    concert_tour: 'primary' as const,
    rehearsal: 'warning' as const,
    other: 'neutral' as const
};

// Update the getEventsForDate function
const getEventsForDate = (day: any) => {
    let dateObj: Date;
    if (day instanceof Date) {
        dateObj = day;
    } else if (day && typeof day === 'object' && 'year' in day && 'month' in day && 'day' in day) {
        dateObj = new Date(day.year, day.month - 1, day.day);
    } else {
        return [];
    }
    return events.value.filter((event) => {
        const eventDate = new Date(event.date as string);
        return (
            eventDate.getDate() === dateObj.getDate() &&
            eventDate.getMonth() === dateObj.getMonth() &&
            eventDate.getFullYear() === dateObj.getFullYear()
        );
    }).map(event => ({
        ...event,
        color: eventTypeColors[event.type as keyof typeof eventTypeColors] || 'neutral'
    }));
};

// Update the onPlaceholderUpdate function
const onPlaceholderUpdate = (date: any) => {
    if (date instanceof Date) {
        selectedDate.value = date;
    } else if (date && typeof date === 'object' && 'year' in date && 'month' in date && 'day' in date) {
        // Convert CalendarDate/SerializableDate to Date
        selectedDate.value = new Date(date.year, date.month - 1, date.day);
    }
};

// Update the formatDate function
const formatDate = (date: string) => {
    const eventDate = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${eventDate.getDate().toString().padStart(2, '0')} ${months[eventDate.getMonth()]} ${eventDate.getFullYear()}`;
};

// Update the upcomingEvents computed property
const upcomingEvents = computed(() => {
    const now = new Date();
    return events.value
        .filter(event => {
            const eventDate = new Date(event.date as string);
            return eventDate >= now;
        })
        .sort((a, b) => {
            const dateA = new Date(a.date as string);
            const dateB = new Date(b.date as string);
            return dateA.getTime() - dateB.getTime();
        })
        .map(event => ({
            ...event,
            color: eventTypeColors[event.type as keyof typeof eventTypeColors] || 'neutral'
        }))
        .slice(0, 5); // Show next 5 events
});

// Handle file import
const handleFileImport = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target && target.files?.[0]) {
        try {
            await importEvents(target.files[0]);
            target.value = '';
        } catch (error) {
            console.error('Failed to import file:', error);
        }
    }
};

// Export/Import dropdown items
const exportImportItems = [
    {
        label: 'Export Events',
        icon: 'i-heroicons-arrow-down-tray',
        click: () => exportEvents()
    },
    {
        label: 'Import Events',
        icon: 'i-heroicons-arrow-up-tray',
        click: () => fileInput.value?.click()
    }
];

// Load events when component mounts
onMounted(() => {
    fetchEvents();
});

const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
};

const showEventDetails = (event: CalendarEvent) => {
    selectedEvent.value = event;
    showEditEventModal.value = true;
};

const showAllEvents = () => {
    // Implement the logic to show all events in a list view
    // This could be a new route or a modal with a list view
    console.log("Show all events");
};
</script>

<style scoped>
.event-name {
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.event-container {
    background-color: var(--color-background);
}

html.dark .event-container {
    background-color: var(--color-surface);
}
</style>

<EventModal
    v-model="showNewEventModal"
    @save="handleEventSave"
/>

<EventModal
    v-model="showEditEventModal"
    :event="selectedEvent"
    @save="handleEventSave"
/>
