<template>
    <div class="timeline-container">
        <div class="timeline-wrapper">
            <div v-for="(event, index) in sortedEvents" :key="event.date" class="timeline-item group">
                <div class="timeline-marker">
                    <div class="timeline-dot" :class="getMarkerClass(index)">
                        <Icon :name="getIconComponent(event.icon)" class="timeline-icon" />
                    </div>
                    <div v-if="index !== events.length - 1" class="timeline-connector" :class="getConnectorClass(index)"></div>
                </div>
                
                <div class="timeline-content">
                    <div class="timeline-card">
                        <div class="timeline-header">
                            <h3 class="timeline-title">{{ event.title }}</h3>
                            <span class="timeline-date">{{ formatDate(event.date) }}</span>
                        </div>
                        
                        <p class="timeline-description">{{ event.description }}</p>
                        
                        <div class="timeline-footer">
                            <a 
                                v-if="event.link" 
                                :href="event.link" 
                                target="_blank" 
                                class="timeline-link"
                            >
                                Learn More
                                <Icon name="mdi:arrow-right" class="h-4 w-4 ml-1 inline" />
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
        'bg-emerald-500',
        'bg-blue-500', 
        'bg-amber-500',
        'bg-purple-500',
        'bg-pink-500'
    ];
    return colors[index % colors.length];
}

function getConnectorClass(index: number) {
    const colors = [
        'bg-emerald-300',
        'bg-blue-300', 
        'bg-amber-300',
        'bg-purple-300',
        'bg-pink-300'
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

<style scoped>
.timeline-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
    max-width: 600px;
    margin: 0 auto;
}

.timeline-wrapper {
    position: relative;
    width: 100%;
}

.timeline-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 2rem;
}

.timeline-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-right: 1rem;
    position: relative;
}

.timeline-dot {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s;
}

.timeline-dot:hover {
    transform: scale(1.1);
}

.timeline-icon {
    color: white;
}

.timeline-connector {
    width: 0.25rem;
    flex-grow: 1;
    position: absolute;
    top: 2.5rem;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.7;
    height: calc(100% - 2.5rem);
    background-color: #d1d5db; /* Gray-300 */
}

.timeline-content {
    flex-grow: 1;
}

.timeline-card {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    transition: transform 0.3s, box-shadow 0.3s;
    border: 1px solid #e5e7eb; /* Gray-200 */
}

/* Add dark mode support */
@media (prefers-color-scheme: dark) {
    .timeline-card {
        background-color: #121212; /* Dark mode background */
        border: 1px solid #2c2c2c; /* Adjust border for dark mode */
    }
}

.timeline-card:hover {
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
    transform: translateY(-0.5rem);
}

.timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e5e7eb; /* Gray-200 */
}

.timeline-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937; /* Gray-800 */
}

.timeline-date {
    font-size: 0.875rem;
    color: #6b7280; /* Gray-500 */
}

.timeline-description {
    color: #4b5563; /* Gray-600 */
    margin-bottom: 1rem;
    font-size: 0.875rem;
    line-height: 1.5;
}

.timeline-link {
    display: inline-flex;
    align-items: center;
    color: #2563eb; /* Blue-600 */
    font-weight: 500;
    font-size: 0.875rem;
    transition: color 0.2s;
}

.timeline-link:hover {
    color: #1d4ed8; /* Blue-800 */
}
</style>