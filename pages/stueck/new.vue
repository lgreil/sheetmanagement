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

            <div class="form-info-banner">
                <p>
                    Fields marked with <span class="required-field">*</span> are
                    required. Please fill out the form with accurate
                    information.
                </p>
            </div>

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
                            <UFormGroup
                                label="Title <span class='required-field'>*</span>"
                                name="name"
                            >
                                <UInput
                                    v-model="state.name"
                                    class="form-input"
                                    placeholder="e.g. Symphony No. 5"
                                />
                                <span class="field-help"
                                    >Enter the complete title of the piece</span
                                >
                            </UFormGroup>

                            <UFormGroup
                                label="Genre <span class='required-field'>*</span>"
                                name="genre"
                            >
                                <UInput
                                    v-model="state.genre"
                                    class="form-input"
                                    placeholder="e.g. Classical, Jazz, March"
                                />
                                <span class="field-help"
                                    >Musical style or category</span
                                >
                            </UFormGroup>

                            <UFormGroup
                                label="Year <span class='required-field'>*</span>"
                                name="year"
                            >
                                <UNumberInput
                                    v-model="state.year"
                                    class="form-input year-input"
                                    placeholder="e.g. 1808"
                                />
                                <span class="field-help"
                                    >Year of composition (1000-2024)</span
                                >
                            </UFormGroup>

                            <UFormGroup
                                label="Difficulty <span class='required-field'>*</span>"
                                name="difficulty"
                            >
                                <USelect
                                    v-model="state.difficulty"
                                    :options="difficultyOptions"
                                    class="form-input"
                                />
                                <span class="field-help"
                                    >Select the playing difficulty level</span
                                >
                            </UFormGroup>

                            <UFormGroup
                                label="Is Digitized"
                                name="digitized"
                                class="digitized-checkbox"
                            >
                                <UCheckbox v-model="state.digitized" />
                                <span class="field-help ml-2"
                                    >Check if sheet music is available in
                                    digital format</span
                                >
                            </UFormGroup>

                            <UFormGroup
                                label="Description"
                                name="description"
                                class="md:col-span-2"
                            >
                                <UTextarea
                                    v-model="state.description"
                                    class="form-input"
                                    placeholder="e.g. This piece was composed for a special occasion..."
                                />
                                <span class="field-help"
                                    >Brief description of the piece, its
                                    history, or special notes</span
                                >
                            </UFormGroup>

                            <UFormGroup
                                label="Sheet Music URL"
                                name="sheetMusicUrl"
                                class="md:col-span-2"
                            >
                                <UInput
                                    v-model="state.sheetMusicUrl"
                                    placeholder="https://example.com/sheet-music.pdf"
                                    class="form-input"
                                />
                                <span class="field-help"
                                    >Full URL to the digital sheet music (if
                                    available)</span
                                >
                            </UFormGroup>

                            <UFormGroup
                                label="Image URL"
                                name="imageUrl"
                                class="md:col-span-2"
                            >
                                <UInput
                                    v-model="state.imageUrl"
                                    placeholder="https://example.com/image.jpg"
                                    class="form-input"
                                />
                                <span class="field-help"
                                    >Full URL to an image representing the piece
                                    (cover art, etc.)</span
                                >
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
                            <UFormGroup
                                label="Composer(s) <span class='required-field'>*</span>"
                                name="komponiert"
                            >
                                <UInput
                                    v-model="state.komponiert"
                                    class="form-input"
                                    placeholder="e.g. Ludwig van Beethoven, Wolfgang Amadeus Mozart"
                                />
                                <span class="field-help"
                                    >For multiple composers, separate names with
                                    commas</span
                                >
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
                                    placeholder="e.g. John Williams, Hans Zimmer"
                                />
                                <span class="field-help"
                                    >For multiple arrangers, separate names with
                                    commas</span
                                >
                            </UFormGroup>
                        </div>
                    </template>
                </UCard>

                <div class="form-example-card">
                    <h3>Example Entry</h3>
                    <p><strong>Title:</strong> Symphony No. 5 in C minor</p>
                    <p><strong>Genre:</strong> Classical</p>
                    <p><strong>Year:</strong> 1808</p>
                    <p><strong>Difficulty:</strong> hard</p>
                    <p><strong>Composer:</strong> Ludwig van Beethoven</p>
                    <p>
                        <strong>Description:</strong> One of Beethoven's most
                        popular compositions, known for its distinctive
                        four-note opening motif.
                    </p>
                </div>

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

/* Year input specific styling */
.year-input {
    width: 100% !important;
    min-width: 120px;
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

/* Field help text */
.field-help {
    display: block;
    font-size: 0.875rem;
    color: #666;
    margin-top: 0.25rem;
}

/* Form info banner */
.form-info-banner {
    background-color: rgba(var(--color-primary-rgb), 0.05);
    border-left: 4px solid var(--color-primary);
    padding: 1rem;
    margin-bottom: 1.5rem;
    border-radius: 0.5rem;
}

/* Required field marking */
.required-field {
    color: #e53e3e;
    font-weight: bold;
}

/* Example entry card */
.form-example-card {
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 0.75rem;
    padding: 1.25rem;
    margin-top: 1rem;
    border: 1px dashed rgba(0, 0, 0, 0.1);
}

.form-example-card h3 {
    font-weight: 600;
    margin-bottom: 0.75rem;
    color: var(--color-primary);
}

.form-example-card p {
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
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
