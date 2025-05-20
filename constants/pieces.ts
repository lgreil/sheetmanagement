export const DIFFICULTY_LEVELS = {
    VERY_EASY: 'very_easy',
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
    VERY_HARD: 'very_hard'
} as const;

export const DIFFICULTY_LABELS: Record<keyof typeof DIFFICULTY_LEVELS, { de: string; en: string }> = {
    VERY_EASY: { de: 'Sehr Leicht', en: 'Very Easy' },
    EASY: { de: 'Leicht', en: 'Easy' },
    MEDIUM: { de: 'Mittel', en: 'Medium' },
    HARD: { de: 'Schwer', en: 'Hard' },
    VERY_HARD: { de: 'Sehr Schwer', en: 'Very Hard' }
};

export const DIFFICULTY_COLORS: Record<keyof typeof DIFFICULTY_LEVELS, 'success' | 'warning' | 'error' | 'neutral'> = {
    VERY_EASY: 'success',
    EASY: 'success',
    MEDIUM: 'warning',
    HARD: 'error',
    VERY_HARD: 'error'
};

export const GENRES = {
    CLASSICAL: 'classical',
    BAROQUE: 'baroque',
    MODERN: 'modern',
    POP_ROCK: 'pop_rock',
    FILM_MUSIC: 'film_music',
    MUSICAL: 'musical'
} as const;

export const GENRE_LABELS: Record<keyof typeof GENRES, { de: string; en: string }> = {
    CLASSICAL: { de: 'Klassik', en: 'Classical' },
    BAROQUE: { de: 'Barock', en: 'Baroque' },
    MODERN: { de: 'Modern', en: 'Modern' },
    POP_ROCK: { de: 'Pop / Rock / Modern', en: 'Pop / Rock / Modern' },
    FILM_MUSIC: { de: 'Filmmusik', en: 'Film Music' },
    MUSICAL: { de: 'Musical', en: 'Musical' }
}; 