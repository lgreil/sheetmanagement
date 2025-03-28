<template>
    <UTooltip :text="tooltipText">
        <div class="digital-availability">
            <span
                :class="[
                    'digital-indicator',
                    { 'digital-available': isDigitized },
                ]"
                :aria-label="ariaLabel"
                role="status"
            />
            <span v-if="showLabel" class="digital-label">
                {{ displayText }}
            </span>
        </div>
    </UTooltip>
</template>

<script setup lang="ts">
import { computed, toRefs } from "vue";

interface Props {
    isDigitized: boolean;
    showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    showLabel: false,
});

const displayText = computed(() =>
    props.isDigitized ? "Digital Available" : "Print Only",
);

const tooltipText = computed(() =>
    props.isDigitized
        ? "Digital version is available for this piece"
        : "Only printed version available",
);

const ariaLabel = computed(() =>
    props.isDigitized
        ? "Digital version available"
        : "No digital version available",
);

const { isDigitized, showLabel } = toRefs(props);
</script>

<style scoped>
.digital-availability {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family:
        system-ui,
        -apple-system,
        sans-serif;
}

.digital-indicator {
    display: block;
    width: 0.625rem;
    height: 0.625rem;
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 150ms ease-in-out;
    will-change: transform, background-color, box-shadow;
}

.digital-available {
    background-color: var(--color-accent);
    box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.digital-indicator:not(.digital-available) {
    background-color: var(--color-secondary);
}

@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
    }
    50% {
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
    }
}

.digital-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--color-muted-text);
    white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
    .digital-available {
        animation: none;
        box-shadow: 0 0 2px rgba(16, 185, 129, 0.5);
    }
}
</style>
