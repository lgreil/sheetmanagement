<template>
    <UTooltip :text="tooltipText">
        <div
            class="relative h-5 rounded-full overflow-hidden difficulty-badge"
            :style="{ backgroundColor: 'var(--color-border)' }"
            :aria-valuenow="difficultyPercentage"
            aria-valuemin="0"
            aria-valuemax="100"
            role="progressbar"
        >
            <div
                class="h-full transition-all difficulty-bar"
                :class="difficultyClass"
                :style="{ width: `${difficultyPercentage}%` }"
            ></div>
            <span
                class="absolute inset-0 flex items-center justify-center text-xs font-semibold difficulty-text"
                :style="{ color: 'var(--color-text)' }"
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
}

.difficulty-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-text);
}

.difficulty-bar {
    height: 100%;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
}

.easy-difficulty {
    background-color: var(--color-accent);
}

.medium-difficulty {
    background-color: #f59e0b; /* amber-500 equivalent */
}

.hard-difficulty {
    background-color: #f43f5e; /* rose-500 equivalent */
}

.very-hard-difficulty {
    background-color: #b91c1c; /* red-700 equivalent */
}

.unknown-difficulty {
    background-color: var(--color-secondary);
}

/* Dynamic text color based on percentage */
.difficulty-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
