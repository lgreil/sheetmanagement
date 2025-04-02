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
}

.digital-indicator {
    display: flex;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    flex-shrink: 0;
    transition: all 200ms ease;
    position: relative;
    border: 1px solid;
}

.digital-available {
    background-color: var(--color-success-100);
    border-color: var(--color-success-300);
}

.digital-indicator:not(.digital-available) {
    background-color: var(--color-secondary-100);
    border-color: var(--color-secondary-300);
}

.digital-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
}

/* Dark mode adjustments */
:root[data-color-mode="dark"] .digital-available {
    background-color: var(--color-success-900);
    border-color: var(--color-success-600);
}

:root[data-color-mode="dark"] .digital-indicator:not(.digital-available) {
    background-color: var(--color-secondary-900);
    border-color: var(--color-secondary-600);
}
</style>
