<template>
    <div class="new-piece-container">
        <div class="new-piece-wrapper">
            <UButton
                icon="i-heroicons-arrow-left"
                @click="router.push('/stuecke')"
                class="back-button"
            >
                Go Back
            </UButton>

            <h1 class="new-piece-title">Add New Piece</h1>

            <UForm
                :schema="schema"
                :state="state"
                @submit="onSubmit"
                class="form-container"
            >
                <UCard class="form-card">
                    <template #header>
                        <div class="card-header">
                            <h2 class="card-header-title">Piece Information</h2>
                        </div>
                    </template>
                    <template #default>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UFormGroup label="Title" name="name">
                                <UInput
                                    v-model="state.name"
                                    class="form-input"
                                />
                            </UFormGroup>

                            <UFormGroup label="Genre" name="genre">
                                <UInput
                                    v-model="state.genre"
                                    class="form-input"
                                />
                            </UFormGroup>

                            <UFormGroup label="Year" name="year">
                                <UNumberInput
                                    v-model="state.year"
                                    class="form-input"
                                />
                            </UFormGroup>

                            <UFormGroup label="Difficulty" name="difficulty">
                                <USelect
                                    v-model="state.difficulty"
                                    :options="difficultyOptions"
                                    class="form-input"
                                />
                            </UFormGroup>

                            <UFormGroup
                                label="Is Digitized"
                                name="digitized"
                                class="digitized-checkbox"
                            >
                                <UCheckbox v-model="state.digitized" />
                            </UFormGroup>

                            <UFormGroup
                                label="Description"
                                name="description"
                                class="md:col-span-2"
                            >
                                <UTextarea
                                    v-model="state.description"
                                    class="form-input"
                                />
                            </UFormGroup>

                            <UFormGroup
                                label="Sheet Music URL"
                                name="sheetMusicUrl"
                                class="md:col-span-2"
                            >
                                <UInput
                                    v-model="state.sheetMusicUrl"
                                    placeholder="Optional"
                                    class="form-input"
                                />
                            </UFormGroup>

                            <UFormGroup
                                label="Image URL"
                                name="imageUrl"
                                class="md:col-span-2"
                            >
                                <UInput
                                    v-model="state.imageUrl"
                                    placeholder="Optional"
                                    class="form-input"
                                />
                            </UFormGroup>
                        </div>
                    </template>
                </UCard>

                <UCard class="form-card">
                    <template #header>
                        <div class="card-header">
                            <h2 class="card-header-title">Composers</h2>
                        </div>
                    </template>
                    <template #default>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UFormGroup label="Composer(s)" name="komponiert">
                                <UInput
                                    v-model="state.komponiert"
                                    class="form-input"
                                />
                            </UFormGroup>
                        </div>
                    </template>
                </UCard>

                <UCard class="form-card">
                    <template #header>
                        <div class="card-header">
                            <h2 class="card-header-title">Arrangers</h2>
                        </div>
                    </template>
                    <template #default>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UFormGroup label="Arranger(s)" name="arrangiert">
                                <UInput
                                    v-model="state.arrangiert"
                                    class="form-input"
                                />
                            </UFormGroup>
                        </div>
                    </template>
                </UCard>

                <div class="flex justify-end mt-6">
                    <UButton
                        type="submit"
                        color="primary"
                        :loading="isSubmitting"
                        :disabled="isSubmitting"
                        class="submit-button"
                    >
                        Add Piece
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "#app";
import { useMusicData } from "~/composables/useMusicData";
import { z } from "zod";

const router = useRouter();
const { addPiece } = useMusicData();
const isSubmitting = ref(false);

const difficultyOptions = ["easy", "medium", "hard", "very-hard"];

const schema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    genre: z
        .string()
        .min(2, { message: "Genre must be at least 2 characters." }),
    year: z
        .number()
        .min(1000, { message: "Year must be a valid year." })
        .max(2024, { message: "Year must be a valid year." }),
    difficulty: z.enum(["easy", "medium", "hard", "very-hard"]),
    digitized: z.boolean(),
    description: z.string().optional(),
    sheetMusicUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    komponiert: z.string().optional(),
    arrangiert: z.string().optional(),
});

const state = ref({
    name: "",
    genre: "",
    year: 2000,
    difficulty: "easy",
    digitized: false,
    description: undefined,
    sheetMusicUrl: undefined,
    imageUrl: undefined,
    komponiert: undefined,
    arrangiert: undefined,
});

async function onSubmit() {
    isSubmitting.value = true;

    try {
        await addPiece(state.value);
        router.push("/stuecke"); // Redirect to the list of pieces
    } catch (error) {
        console.error("Failed to add piece:", error);
        alert("Failed to add piece. Please check the console for details.");
    } finally {
        isSubmitting.value = false;
    }
}

function goBack() {
    router.back();
}
</script>

<style scoped>
/* General container for the entire page */
.new-piece-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 2rem 1rem;
}

/* Wrapper for the content to apply consistent styling */
.new-piece-wrapper {
    background-color: var(--color-surface);
    border-radius: 0.75rem;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    padding: 2rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Back button styling */
.back-button {
    margin-bottom: 1.5rem;
    transition: transform 0.2s ease;
}

.back-button:hover {
    transform: translateX(-4px);
}

/* Styles for form headers */
.new-piece-title {
    font-size: 2.25rem;
    font-weight: 700;
    margin-bottom: 2rem;
    text-align: center;
    color: var(--color-text);
    letter-spacing: -0.02em;
}

.card-header {
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-header-title {
    color: var(--color-text);
    font-weight: 600;
    font-size: 1.25rem;
}

/* Form container and card styling */
.form-container {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
}

.form-card {
    border-radius: 0.75rem;
    border: 1px solid rgba(0, 0, 0, 0.05);
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.form-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
}

/* Form input styling */
.form-input {
    transition: all 0.2s ease;
    border-width: 1px;
}

.form-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.15);
}

/* Checkbox styling */
.digitized-checkbox {
    display: flex;
    align-items: center;
}

/* Submit button styling */
.submit-button {
    padding: 0.75rem 2rem;
    font-weight: 600;
    border-radius: 0.5rem;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}

.submit-button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .new-piece-wrapper {
        padding: 1.5rem 1rem;
    }

    .new-piece-title {
        font-size: 1.75rem;
        margin-bottom: 1.5rem;
    }
}
</style>
