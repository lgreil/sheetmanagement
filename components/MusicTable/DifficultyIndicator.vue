<template>
    <UTooltip :text="tooltipText">
        <div
            class="relative h-4 rounded-full overflow-hidden difficulty-badge"
            :aria-valuenow="difficultyPercentage"
            aria-valuemin="0"
            aria-valuemax="100"
            role="progressbar"
        >
            <div
                class="h-full transform transition-transform ease-out duration-300 difficulty-bar"
                :class="difficultyClass"
                :style="{ width: `${difficultyPercentage}%` }"
            ></div>
            <span
                class="absolute inset-0 flex items-center justify-center text-2xs font-medium difficulty-text"
            >
                {{ displayText }}
            </span>
        </div>
    </UTooltip>
</template>

<script setup lang="ts">
import type { DifficultyLevel } from "~/types/table";

interface Props {
    level: DifficultyLevel;
}

const props = defineProps<Props>();

const difficultyData = computed(() => {
    switch (props.level) {
        case "easy":
            return {
                text: "Leicht",
                percentage: 25,
                barClass: "easy-difficulty",
            };
        case "medium":
            return {
                text: "Mittel",
                percentage: 50,
                barClass: "medium-difficulty",
            };
        case "hard":
            return {
                text: "Schwer",
                percentage: 75,
                barClass: "hard-difficulty",
            };
        case "very-hard":
            return {
                text: "Sehr Schwer",
                percentage: 100,
                barClass: "very-hard-difficulty",
            };
        default:
            return {
                text: "Unbekannt",
                percentage: 0,
                barClass: "unknown-difficulty",
            };
    }
});

const displayText = computed(() => difficultyData.value.text);
const difficultyPercentage = computed(() => difficultyData.value.percentage);
const difficultyClass = computed(() => difficultyData.value.barClass);

const tooltipText = computed(() => `Difficulty Level: ${displayText.value}`);
</script>

<style scoped>
.difficulty-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    min-width: 5rem;
    height: 1.5rem;
    position: relative;
    overflow: hidden;
    transition: all 200ms ease;
    background-color: var(--color-surface);
    border: 1px solid;
}

.difficulty-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.difficulty-text {
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    white-space: nowrap;
    z-index: 1;
}

/* Easy */
.easy-difficulty + .difficulty-text {
    color: var(--color-success-700);
}
.difficulty-badge:has(.easy-difficulty) {
    background-color: var(--color-success-50);
    border-color: var(--color-success-200);
}

/* Medium */
.medium-difficulty + .difficulty-text {
    color: var(--color-warning-700);
}
.difficulty-badge:has(.medium-difficulty) {
    background-color: var(--color-warning-50);
    border-color: var(--color-warning-200);
}

/* Hard */
.hard-difficulty + .difficulty-text {
    color: var(--color-error-700);
}
.difficulty-badge:has(.hard-difficulty) {
    background-color: var(--color-error-50);
    border-color: var(--color-error-200);
}

/* Very Hard */
.very-hard-difficulty + .difficulty-text {
    color: var(--color-error-800);
}
.difficulty-badge:has(.very-hard-difficulty) {
    background-color: var(--color-error-100);
    border-color: var(--color-error-300);
}

/* Unknown */
.unknown-difficulty + .difficulty-text {
    color: var(--color-secondary-600);
}
.difficulty-badge:has(.unknown-difficulty) {
    background-color: var(--color-secondary-50);
    border-color: var(--color-secondary-200);
}

/* Dark mode adjustments */
:root[data-color-mode="dark"] .difficulty-badge {
    background-color: var(--color-surface);
}

:root[data-color-mode="dark"] .easy-difficulty + .difficulty-text {
    color: var(--color-success-400);
}
:root[data-color-mode="dark"] .difficulty-badge:has(.easy-difficulty) {
    background-color: var(--color-success-950);
    border-color: var(--color-success-700);
}

:root[data-color-mode="dark"] .medium-difficulty + .difficulty-text {
    color: var(--color-warning-400);
}
:root[data-color-mode="dark"] .difficulty-badge:has(.medium-difficulty) {
    background-color: var(--color-warning-950);
    border-color: var(--color-warning-700);
}

:root[data-color-mode="dark"] .hard-difficulty + .difficulty-text {
    color: var(--color-error-400);
}
:root[data-color-mode="dark"] .difficulty-badge:has(.hard-difficulty) {
    background-color: var(--color-error-950);
    border-color: var(--color-error-700);
}

:root[data-color-mode="dark"] .very-hard-difficulty + .difficulty-text {
    color: var(--color-error-300);
}
:root[data-color-mode="dark"] .difficulty-badge:has(.very-hard-difficulty) {
    background-color: var(--color-error-950);
    border-color: var(--color-error-600);
}

:root[data-color-mode="dark"] .unknown-difficulty + .difficulty-text {
    color: var(--color-secondary-400);
}
:root[data-color-mode="dark"] .difficulty-badge:has(.unknown-difficulty) {
    background-color: var(--color-secondary-950);
    border-color: var(--color-secondary-700);

}

@media (max-width: 640px) {
    .difficulty-badge {
        min-width: 4.5rem;
    }
    .difficulty-text {
        font-size: 0.7rem;
    }
}
</style>
