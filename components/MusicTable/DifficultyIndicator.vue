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
    border-radius: 9999px;
    background-color: var(--color-border);
    min-width: 4rem;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.difficulty-text {
    font-size: 0.65rem;
    font-weight: 500;
    color: var(--color-text);
    letter-spacing: 0.02em;
    white-space: nowrap;
}

.difficulty-bar {
    height: 100%;
    transform-origin: left;
    will-change: transform;
}

.easy-difficulty {
    background-color: var(--color-success);
}

.medium-difficulty {
    background-color: var(--color-warning);
}

.hard-difficulty {
    background-color: var(--color-alert);
}

.very-hard-difficulty {
    background-color: var(--color-error);
}

.unknown-difficulty {
    background-color: var(--color-secondary);
}

.difficulty-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    text-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
}

@media (max-width: 640px) {
    .difficulty-badge {
        min-width: 3rem;
    }
    .difficulty-text {
        font-size: 0.6rem;
    }
}
</style>
