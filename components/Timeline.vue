<template>
    <div class="flex flex-col items-center p-8 max-w-2xl mx-auto">
        <div class="relative w-full">
            <div
                v-for="(event, index) in sortedEvents"
                :key="event.date"
                class="flex items-start mb-8 last:mb-0"
            >
                <div class="flex flex-col items-center mr-4 relative">
                    <div
                        :class="{
                            'w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110': true,
                            [getMarkerClass(index)]: true,
                        }"
                    >
                        <Icon
                            :icon="getIconComponent(event.icon)"
                            class="text-white"
                        />
                    </div>
                    <div
                        v-if="index < events.length - 1"
                        class="w-1 absolute top-10 left-1/2 -translate-x-1/2 opacity-70"
                        :class="getConnectorClass(index)"
                        :style="{ height: 'calc(100% - 2.5rem)' }"
                    ></div>
                </div>

                <div class="flex-grow">
                    <div
                        class="bg-[var(--color-surface)] rounded-lg shadow-md p-6 transition-all duration-300 border border-[var(--color-border)] hover:shadow-lg hover:-translate-y-1"
                    >
                        <div
                            class="flex justify-between items-center mb-3 pb-2 border-b border-[var(--color-border)]"
                        >
                            <h3
                                class="text-lg font-semibold text-[var(--color-text)]"
                            >
                                {{ event.title }}
                            </h3>
                            <span
                                class="text-sm text-[var(--color-muted-text)]"
                                >{{ formatDate(event.date) }}</span
                            >
                        </div>

                        <p
                            class="text-sm text-[var(--color-text)] mb-4 leading-relaxed"
                        >
                            {{ event.description }}
                        </p>

                        <div class="flex justify-end">
                            <a
                                v-if="event.link"
                                :href="event.link"
                                target="_blank"
                                :aria-label="'Learn more about ' + event.title"
                                class="inline-flex items-center text-[var(--color-primary)] font-medium text-sm transition-colors duration-200 hover:opacity-80"
                            >
                                Learn More
                                <Icon
                                    icon="mdi:arrow-right"
                                    class="h-4 w-4 ml-1 inline"
                                />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from "vue";
import type { PropType } from "vue";
import { Icon } from "@iconify/vue"; // Use Iconify for consistent icons

// Define the type for the event object
interface TimelineEvent {
    date: string;
    title: string;
    description: string;
    link?: string;
    icon?: string;
}

const props = defineProps({
    events: {
        type: Array as PropType<TimelineEvent[]>,
        required: true,
        default: () => [],
    },
});

const sortedEvents = computed(() => {
    // Create a new array to avoid mutating the original props.events array
    return [...props.events].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
});

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// Updated timeline colors to match the new color scheme
const colorClasses = {
    primary: { base: "bg-[var(--color-primary)]", light: "bg-[#93c5fd]" }, // Blue
    accent: { base: "bg-[var(--color-accent)]", light: "bg-[#6ee7b7]" }, // Emerald
    warning: { base: "bg-[var(--color-warning)]", light: "bg-[#fcd34d]" }, // Amber
    highlight: { base: "bg-[var(--color-highlight)]", light: "bg-[#c4b5fd]" }, // Violet
    highlight2: {
        base: "bg-[var(--color-highlight-2)]",
        light: "bg-[#f9a8d4]",
    },
};

function getMarkerClass(index: number) {
    const colors = Object.values(colorClasses);
    const color = colors[index % colors.length];
    return color.base;
}

function getConnectorClass(index: number) {
    const colors = Object.values(colorClasses);
    const color = colors[index % colors.length];
    return color.light;
}

function getIconComponent(iconName?: string) {
    const iconMap: Record<string, string> = {
        account: "mdi:account",
        calendar: "mdi:calendar",
        info: "mdi:information",
        link: "mdi:link-variant",
    };

    if (iconName && iconMap[iconName]) {
        return iconMap[iconName];
    } else {
        console.warn(`Unknown icon name: ${iconName}.  Using default icon.`);
        return "mdi:information"; // Default to mdi:information
    }
}
</script>
