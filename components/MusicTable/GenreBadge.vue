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
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text);
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
}

.genre-badge-traditionell {
    background-color: var(--color-primary);
}
.genre-badge-klassik {
    background-color: var(--color-secondary);
}
.genre-badge-barock {
    background-color: var(--color-accent);
}
.genre-badge-moderne-klassik {
    background-color: var(--color-primary);
    opacity: 0.8;
}
.genre-badge-romantik {
    background-color: var(--color-secondary);
    opacity: 0.8;
}
.genre-badge-musicals {
    background-color: var(--color-accent);
    opacity: 0.8;
}
.genre-badge-pop-rock-modern {
    background-color: var(--color-primary);
    opacity: 0.6;
}
.genre-badge-weihnachtsmusik {
    background-color: var(--color-secondary);
    opacity: 0.6;
}
.genre-badge-filmmusik {
    background-color: var(--color-accent);
    opacity: 0.6;
}
</style>
