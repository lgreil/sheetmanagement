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
                        v-model="calendarDate"
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
                                        <div v-if="event.program" class="flex items-start gap-2">
                                            <UIcon
                                                name="i-heroicons-musical-note"
                                                class="mr-1"
                                            />
                                            <span class="whitespace-pre-line">{{ event.program }}</span>
                                        </div>
                                        <div v-if="event.participants?.length" class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <UIcon
                                                name="i-heroicons-users"
                                                class="mr-1"
                                            />
                                            {{ event.participants.length }} participants
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
                                <span>No upcoming events</span>
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
                                <span>View All Events</span>
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
                <div v-if="selectedEvent" class="p-4">
                    <div class="space-y-4">
                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <UBadge :color="selectedEvent.color" size="sm" />
                                <h3 class="text-lg font-semibold">{{ selectedEvent.name }}</h3>
                            </div>
                            <p class="text-gray-600 dark:text-gray-300">{{ selectedEvent.description }}</p>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <div class="flex items-center gap-2">
                                    <UIcon name="i-heroicons-clock" />
                                    <span>{{ formatDate(selectedEvent.date) }} {{ formatTime(selectedEvent.time) }}</span>
                                    <span v-if="selectedEvent.duration">({{ selectedEvent.duration }})</span>
                                </div>

                                <div class="flex items-center gap-2">
                                    <UIcon name="i-heroicons-map-pin" />
                                    <span>{{ selectedEvent.location }}</span>
                                </div>

                                <div v-if="selectedEvent.address" class="flex items-start gap-2">
                                    <UIcon name="i-heroicons-home" />
                                    <span class="whitespace-pre-line">{{ selectedEvent.address }}</span>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <div v-if="selectedEvent.program" class="flex items-start gap-2">
                                    <UIcon name="i-heroicons-musical-note" />
                                    <span class="whitespace-pre-line">{{ selectedEvent.program }}</span>
                                </div>

                                <div v-if="selectedEvent.participants?.length" class="flex items-start gap-2">
                                    <UIcon name="i-heroicons-users" />
                                    <div>
                                        <div>{{ selectedEvent.participants.length }} participants</div>
                                        <div class="text-sm text-gray-500">{{ selectedEvent.participants.join(', ') }}</div>
                                    </div>
                                </div>

                                <div v-if="selectedEvent.notes" class="flex items-start gap-2">
                                    <UIcon name="i-heroicons-document-text" />
                                    <span class="whitespace-pre-line">{{ selectedEvent.notes }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </UCard>
        </UModal>
    </UContainer>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { Event as CalendarEvent } from '~/types/events';

type DOMEvent = Event & {
    target: HTMLInputElement;
};

interface SerializableDate {
    year: number;
    month: number;
    day: number;
}

type DateValue = SerializableDate;

const { events, isLoading, fetchEvents, createEvent, updateEvent, deleteEvent, exportEvents, importEvents } = useEvents();

const selectedDate = useState<SerializableDate>('selectedDate', () => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate()
}));

const showNewEventModal = ref(false);
const showEditEventModal = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// Convert our serializable date to CalendarDate for the calendar component
const calendarDate = computed({
    get: () => selectedDate.value,
    set: (date: DateValue | DateValue[] | null | undefined) => {
        if (date && !Array.isArray(date)) {
            selectedDate.value = {
                year: date.year,
                month: date.month,
                day: date.day
            };
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

// Event interface
interface SerializableDate {
    year: number;
    month: number;
    day: number;
}

interface Event {
    id: number;
    date: SerializableDate;
    name: string;
    time: string;
    location: string;
    description: string;
    type: keyof typeof eventTypes;
    color: string;
    program?: string;
    address?: string;
    participants?: string[];
    notes?: string;
    duration?: string;
}

// Sample events (replace with actual data fetching)
// Load events when component mounts
onMounted(() => {
    fetchEvents();
});

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

// Handle file import
const handleFileImport = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files?.[0]) {
        try {
            await importEvents(target.files[0]);
            target.value = ''; // Reset file input
        } catch (error) {
            console.error('Failed to import file:', error);
        }
    }
};

// Handle event save
const handleEventSave = async (eventData: Omit<CalendarEvent, 'id'>) => {
    try {
        if (selectedEvent.value) {
            await updateEvent({ ...eventData, id: selectedEvent.value.id });
        } else {
            await createEvent(eventData);
        }
    } catch (error) {
        console.error('Failed to save event:', error);
    }
};

// Sample events for testing
const sampleEvents = [
    {
        id: 1,
        date: { year: 2024, month: 7, day: 15 }, // July (months are 1-based)
        name: "Summer Concert",
        time: "19:30",
        location: "City Hall",
        description: "Annual summer concert featuring classical masterpieces",
        type: "CONCERT",
        color: eventTypes.CONCERT.color
    },
    {
        id: 2,
        date: { year: 2024, month: 8, day: 5 }, // August
        name: "Chamber Music Evening",
        time: "20:00",
        location: "Community Center",
        description: "Intimate chamber music performance",
        type: "CONCERT",
        color: eventTypes.CONCERT.color
    },
    {
        id: 3,
        date: { year: 2024, month: 8, day: 20 }, // August
        name: "Orchestral Rehearsal",
        time: "18:00",
        location: "Rehearsal Hall",
        description: "Weekly orchestra rehearsal",
        type: "REHEARSAL",
        color: 'warning'
    },
    {
        id: 4,
        date: { year: 2024, month: 9, day: 10 }, // September
        name: "Board Meeting",
        time: "21:00",
        location: "Conference Room",
        description: "Monthly board meeting to discuss upcoming events",
        type: "MISC",
        color: 'neutral'
    },
    {
        id: 5,
        date: { year: 2024, month: 9, day: 25 }, // September
        name: "Classical Soirée",
        time: "19:00",
        location: "Grand Hall",
        description: "Elegant evening of classical music",
        type: "CONCERT",
        color: eventTypes.CONCERT.color
    },
];

const upcomingEvents = computed(() => {
    const now = {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate()
    };
    return events.value
        .filter(event => {
            if (event.date.year !== now.year) return event.date.year > now.year;
            if (event.date.month !== now.month) return event.date.month > now.month;
            return event.date.day >= now.day;
        })
        .sort((a, b) => {
            if (a.date.year !== b.date.year) return a.date.year - b.date.year;
            if (a.date.month !== b.date.month) return a.date.month - b.date.month;
            return a.date.day - b.date.day;
        })
        .slice(0, 5); // Show next 5 events
});

const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
};

const formatDate = (date: SerializableDate) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.day.toString().padStart(2, '0')} ${months[date.month - 1]} ${date.year}`;
};

const getEventsForDate = (day: DateValue) => {
    return events.value.filter((event) => {
        return event.date.day === day.day && 
               event.date.month === day.month && 
               event.date.year === day.year;
    });
};

const onPlaceholderUpdate = (date: DateValue | DateValue[] | null | undefined) => {
    if (date && !Array.isArray(date)) {
        selectedDate.value = {
            year: date.year,
            month: date.month,
            day: date.day
        };
    }
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
