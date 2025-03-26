<template>
    <div class="flex flex-col items-center p-8 max-w-2xl mx-auto">
        <div class="relative w-full">
            <div v-for="(event, index) in sortedEvents" :key="event.date" class="flex items-start mb-8 last:mb-0">
                <div class="flex flex-col items-center mr-4 relative">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110" :class="getMarkerClass(index)">
                        <Icon :icon="getIconComponent(event.icon)" class="text-white" />
                    </div>
                    <div v-if="index !== events.length - 1" 
                        class="w-1 absolute top-10 left-1/2 -translate-x-1/2 opacity-70"
                        :class="getConnectorClass(index)"
                        :style="{ height: 'calc(100% - 2.5rem)' }">
                    </div>
                </div>
                
                <div class="flex-grow">
                    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300
                        border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1">
                        <div class="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ event.title }}</h3>
                            <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(event.date) }}</span>
                        </div>
                        
                        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">{{ event.description }}</p>
                        
                        <div class="flex justify-end">
                            <a v-if="event.link" 
                                :href="event.link" 
                                target="_blank" 
                                class="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm
                                transition-colors duration-200 hover:text-indigo-800 dark:hover:text-indigo-300">
                                Learn More
                                <Icon icon="mdi:arrow-right" class="h-4 w-4 ml-1 inline" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
import type { PropType } from 'vue';
import { Icon } from '@iconify/vue'; // Use Iconify for consistent icons

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
        default: () => []
    }
});

const sortedEvents = computed(() => 
    [...props.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
);

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getMarkerClass(index: number) {
    const colors = [
        'bg-emerald-500 dark:bg-emerald-600',
        'bg-blue-500 dark:bg-blue-600', 
        'bg-amber-500 dark:bg-amber-600',
        'bg-indigo-500 dark:bg-indigo-600',
        'bg-rose-500 dark:bg-rose-600'
    ];
    return colors[index % colors.length];
}

function getConnectorClass(index: number) {
    const colors = [
        'bg-emerald-300 dark:bg-emerald-400',
        'bg-blue-300 dark:bg-blue-400', 
        'bg-amber-300 dark:bg-amber-400',
        'bg-indigo-300 dark:bg-indigo-400',
        'bg-rose-300 dark:bg-rose-400'
    ];
    return colors[index % colors.length];
}

function getIconComponent(iconName?: string) {
    const iconMap: Record<string, string> = {
        'account': 'mdi:account',
        'calendar': 'mdi:calendar',
        'info': 'mdi:information',
        'link': 'mdi:link-variant',
    };

    return iconName && iconMap[iconName] ? iconMap[iconName] : 'mdi:information'; // Default to mdi:information
}
</script>