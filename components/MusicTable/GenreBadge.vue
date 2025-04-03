<template>
    <UTooltip :text="tooltipText">
        <span :class="['genre-badge', `genre-badge-${normalizedGenre}`]">
            {{ displayText }}
        </span>
    </UTooltip>
</template>

<script setup lang="ts">
import type { GenreType } from "~/types/table";

interface Props {
    genre: GenreType;
}

const props = defineProps<Props>();

const normalizedGenre = computed(() => props.genre.toLowerCase() as GenreType);

const displayText = computed(() => {
    const translations: Record<GenreType, string> = {
        traditionell: "Traditionell",
        klassik: "Klassik",
        barock: "Barock",
        "moderne-klassik": "Moderne Klassik",
        romantik: "Romantik",
        musicals: "Musicals",
        "pop-rock-modern": "Pop/Rock/Modern",
        weihnachtsmusik: "Weihnachtsmusik",
        filmmusik: "Filmmusik",
    };
    return translations[normalizedGenre.value] || props.genre;
});

const tooltipText = computed(() => `Genre: ${displayText.value}`);
</script>

<style scoped>
.genre-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 200ms ease;
    white-space: nowrap;
}

/* Classical Music Family */
.genre-badge-klassik {
    color: var(--color-primary-700);
    background-color: var(--color-primary-50);
    border-left: 3px solid var(--color-primary-500);
}

.genre-badge-barock {
    color: var(--color-primary-700);
    background-color: var(--color-primary-50);
    border-left: 3px solid var(--color-primary-600);
}

.genre-badge-moderne-klassik {
    color: var(--color-primary-700);
    background-color: var(--color-primary-50);
    border-left: 3px solid var(--color-primary-400);
}

.genre-badge-romantik {
    color: var(--color-primary-700);
    background-color: var(--color-primary-50);
    border-left: 3px solid var(--color-primary-300);
}

/* Traditional & Folk */
.genre-badge-traditionell {
    color: var(--color-secondary-700);
    background-color: var(--color-secondary-50);
    border-left: 3px solid var(--color-secondary-500);
}

/* Entertainment Music */
.genre-badge-musicals {
    color: var(--color-success-700);
    background-color: var(--color-success-50);
    border-left: 3px solid var(--color-success-500);
}

.genre-badge-filmmusik {
    color: var(--color-success-700);
    background-color: var(--color-success-50);
    border-left: 3px solid var(--color-success-400);
}

/* Modern Music */
.genre-badge-pop-rock-modern {
    color: var(--color-warning-700);
    background-color: var(--color-warning-50);
    border-left: 3px solid var(--color-warning-500);
}

/* Seasonal */
.genre-badge-weihnachtsmusik {
    color: var(--color-error-700);
    background-color: var(--color-error-50);
    border-left: 3px solid var(--color-error-500);
}

/* Default for unknown genres */
.genre-badge:not([class*="genre-badge-"]) {
    color: var(--color-secondary-700);
    background-color: var(--color-secondary-50);
    border-left: 3px solid var(--color-secondary-400);
}

/* Hover effect */
.genre-badge:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
