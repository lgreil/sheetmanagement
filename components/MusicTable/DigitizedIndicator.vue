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
/* Container for the indicator and label */
.digital-availability {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Base styles for the indicator */
.digital-indicator {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    transition-property: color, background-color, border-color;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}

/* Style for when a digital version is available */
.digital-available {
    background-color: var(--color-accent);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    animation: pulse 2s infinite;
}

/* Style for when only a print version is available */
.digital-indicator:not(.digital-available) {
    background-color: var(--color-secondary);
}
/* Keyframes for pulse animation */
@keyframes pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); /* Using accent color with opacity */
    }

    70% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); /* Expand the shadow then fade */
    }

    100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); /* Fully faded */
    }
}

/* Apply pulse animation only when digital is available */
.digital-available {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Optional label styling (if `showLabel` is true) */
.digital-label {
    font-size: 0.75rem;
    color: var(--color-muted-text);
}
</style>
