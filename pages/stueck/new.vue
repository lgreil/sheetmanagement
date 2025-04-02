<template>
    <div class="new-piece-container">
        <div class="new-piece-wrapper glass-panel">
            <UButton
                icon="i-heroicons-arrow-left"
                @click="router.push('/stuecke')"
                class="back-button"
            >
                Go Back
            </UButton>

            <h1 class="new-piece-title">Add New Piece</h1>

            <div class="form-info-banner">
                <UIcon name="i-heroicons-information-circle" class="info-icon" />
                <p>
                    Fields marked with <span class="required-field">*</span> are required
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
                            <UIcon name="i-heroicons-musical-note" class="section-icon" />
                            <h2 class="card-header-title">Basic Information</h2>
                        </div>
                    </template>
                    <template #default>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <UFormGroup
                                label="Title"
                                name="name"
                                class="form-group"
                            >
                                <template #label>
                                    Title <span class="required-field">*</span>
                                </template>
                                <UInput
                                    v-model="state.name"
                                    class="form-input"
                                    placeholder="e.g. Symphony No. 5"
                                    icon="i-heroicons-document-text"
                                />
                            </UFormGroup>

                            <UFormGroup
                                label="Genre"
                                name="genre"
                                class="form-group"
                            >
                                <template #label>
                                    Genre <span class="required-field">*</span>
                                </template>
                                <USelectMenu
                                    v-model="state.genre"
                                    :options="genreOptions"
                                    class="form-input"
                                    placeholder="Select genre"
                                    option-attribute="label"
                                    value-attribute="value"
                                />
                                <div class="mt-2" v-if="state.genre">
                                    <GenreBadge :genre="state.genre" />
                                </div>
                            </UFormGroup>

                            <UFormGroup
                                label="Difficulty"
                                name="schwierigkeit"
                                class="form-group"
                            >
                                <template #label>
                                    Difficulty <span class="required-field">*</span>
                                </template>
                                <USelectMenu
                                    v-model="state.schwierigkeit"
                                    :options="difficultyOptions"
                                    class="form-input"
                                    placeholder="Select difficulty"
                                    option-attribute="label"
                                    value-attribute="value"
                                />
                                <div class="mt-2" v-if="state.schwierigkeit">
                                    <DifficultyIndicator
                                        :level="state.schwierigkeit"
                                        class="inline-block"
                                    />
                                </div>
                            </UFormGroup>

                            <UFormGroup
                                label="Year"
                                name="jahr"
                                class="form-group"
                            >
                                <UPopover>
                                    <UInput
                                        v-model="state.jahr"
                                        type="text"
                                        class="form-input"
                                        :placeholder="new Date().getFullYear().toString()"
                                        icon="i-heroicons-calendar"
                                        readonly
                                    />
                                    <template #panel>
                                        <UCalendar
                                            v-model="state.jahr"
                                            :min="1000"
                                            :max="new Date().getFullYear()"
                                            mode="year"
                                        />
                                    </template>
                                </UPopover>
                            </UFormGroup>

                            <UFormGroup
                                label="Digitized Status"
                                name="isdigitalisiert"
                                class="digitized-group form-group"
                            >
                                <div class="flex items-center gap-4">
                                    <USwitch
                                        v-model="state.isdigitalisiert"
                                        class="digitized-toggle"
                                    />
                                    <DigitizedIndicator
                                        :isDigitized="state.isdigitalisiert"
                                    />
                                </div>
                            </UFormGroup>
                        </div>
                    </template>
                </UCard>

                <UCard class="form-card">
                    <template #header>
                        <div class="card-header">
                            <UIcon name="i-heroicons-users" class="section-icon" />
                            <h2 class="card-header-title">People</h2>
                        </div>
                    </template>
                    <template #default>
                        <div class="grid grid-cols-1 gap-6">
                            <UFormGroup
                                name="komponiert"
                                class="form-group"
                            >
                                <template #label>
                                    Composer(s) <span class="required-field">*</span>
                                </template>
                                <div v-for="(composer, index) in state.komponiert" :key="index" class="composer-row">
                                    <div class="composer-inputs">
                                        <div class="relative flex-1">
                                            <UInput
                                                v-model="composer.vorname"
                                                placeholder="First Name"
                                                class="composer-input"
                                                @input="updateComposerSuggestions(index, 'vorname')"
                                            />
                                            <div v-if="composer.suggestions?.length" class="suggestions-dropdown">
                                                <button
                                                    v-for="suggestion in composer.suggestions"
                                                    :key="suggestion.vorname + suggestion.name"
                                                    class="suggestion-item"
                                                    @click="selectComposerSuggestion(index, suggestion)"
                                                >
                                                    {{ suggestion.vorname }} {{ suggestion.name }}
                                                </button>
                                            </div>
                                        </div>
                                        <div class="relative flex-1">
                                            <UInput
                                                v-model="composer.name"
                                                placeholder="Last Name"
                                                class="composer-input"
                                                @input="updateComposerSuggestions(index, 'name')"
                                            />
                                            <div v-if="composer.suggestions?.length" class="suggestions-dropdown">
                                                <button
                                                    v-for="suggestion in composer.suggestions"
                                                    :key="suggestion.vorname + suggestion.name"
                                                    class="suggestion-item"
                                                    @click="selectComposerSuggestion(index, suggestion)"
                                                >
                                                    {{ suggestion.vorname }} {{ suggestion.name }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <UButton
                                        icon="i-heroicons-trash"
                                        color="red"
                                        variant="ghost"
                                        @click="removeComposer(index)"
                                        class="remove-button"
                                    />
                                </div>
                                <UButton
                                    icon="i-heroicons-plus"
                                    variant="ghost"
                                    @click="addComposer"
                                    class="add-button"
                                >
                                    Add Composer
                                </UButton>
                            </UFormGroup>

                            <UFormGroup
                                label="Arranger(s)"
                                name="arrangiert"
                            >
                                <div v-for="(arranger, index) in state.arrangiert" :key="index" class="arranger-row">
                                    <div class="arranger-inputs">
                                        <div class="relative flex-1">
                                            <UInput
                                                v-model="arranger.vorname"
                                                placeholder="First Name"
                                                class="arranger-input"
                                                @input="updateArrangerSuggestions(index, 'vorname')"
                                            />
                                            <div v-if="arranger.suggestions?.length" class="suggestions-dropdown">
                                                <button
                                                    v-for="suggestion in arranger.suggestions"
                                                    :key="suggestion.vorname + suggestion.name"
                                                    class="suggestion-item"
                                                    @click="selectArrangerSuggestion(index, suggestion)"
                                                >
                                                    {{ suggestion.vorname }} {{ suggestion.name }}
                                                </button>
                                            </div>
                                        </div>
                                        <div class="relative flex-1">
                                            <UInput
                                                v-model="arranger.name"
                                                placeholder="Last Name"
                                                class="arranger-input"
                                                @input="updateArrangerSuggestions(index, 'name')"
                                            />
                                            <div v-if="arranger.suggestions?.length" class="suggestions-dropdown">
                                                <button
                                                    v-for="suggestion in arranger.suggestions"
                                                    :key="suggestion.vorname + suggestion.name"
                                                    class="suggestion-item"
                                                    @click="selectArrangerSuggestion(index, suggestion)"
                                                >
                                                    {{ suggestion.vorname }} {{ suggestion.name }}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <UButton
                                        icon="i-heroicons-trash"
                                        color="red"
                                        variant="ghost"
                                        @click="removeArranger(index)"
                                        class="remove-button"
                                    />
                                </div>
                                <UButton
                                    icon="i-heroicons-plus"
                                    variant="ghost"
                                    @click="addArranger"
                                    class="add-button"
                                >
                                    Add Arranger
                                </UButton>
                            </UFormGroup>
                        </div>
                    </template>
                </UCard>

                <div class="form-actions">
                    <UButton
                        type="button"
                        @click="router.push('/stuecke')"
                        color="gray"
                    >
                        Cancel
                    </UButton>
                    <UButton
                        type="submit"
                        color="primary"
                        :loading="isSubmitting"
                    >
                        Create Piece
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from '#app';
import { z } from 'zod';
import DifficultyIndicator from '~/components/MusicTable/DifficultyIndicator.vue';
import DigitizedIndicator from '~/components/MusicTable/DigitizedIndicator.vue';
import GenreBadge from '~/components/MusicTable/GenreBadge.vue';

const router = useRouter();
const isSubmitting = ref(false);

// Genre options matching your existing data structure
const genreOptions = [
    { label: 'Klassik', value: 'klassik' },
    { label: 'Barock', value: 'barock' },
    { label: 'Romantik', value: 'romantik' },
    { label: 'Pop / Rock / Modern', value: 'pop_rock_modern' },
    { label: 'Filmmusik', value: 'filmmusik' },
    { label: 'Musicals', value: 'musicals' },
    { label: 'Marsch', value: 'marsch' }
];

// Difficulty options matching your existing data structure
const difficultyOptions = [
    { label: 'Very Easy', value: 'very_easy' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
    { label: 'Very Hard', value: 'very_hard' }
];

// Mock data for composer/arranger suggestions (replace with API call later)
const existingPeople = [
    { vorname: 'Ludwig van', name: 'Beethoven' },
    { vorname: 'Wolfgang Amadeus', name: 'Mozart' },
    { vorname: 'Johann Sebastian', name: 'Bach' },
    { vorname: 'Richard', name: 'Meyer' },
    { vorname: 'Keith', name: 'Christopher' },
    { vorname: 'Ted', name: 'Ricketts' },
    { vorname: 'Howard', name: 'Shore' },
    { vorname: 'Hans', name: 'Zimmer' }
];

const state = ref({
    name: '',
    genre: '',
    schwierigkeit: '',
    jahr: null,
    isdigitalisiert: false,
    komponiert: [{ vorname: '', name: '', suggestions: [] }],
    arrangiert: [{ vorname: '', name: '', suggestions: [] }],
});

// Function to search for people suggestions
function searchPeople(query: string): { vorname: string; name: string }[] {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();
    return existingPeople.filter(person => 
        person.vorname.toLowerCase().includes(lowerQuery) ||
        person.name.toLowerCase().includes(lowerQuery)
    );
}

// Update composer suggestions
function updateComposerSuggestions(index: number, field: 'vorname' | 'name') {
    const composer = state.value.komponiert[index];
    const query = composer[field];
    composer.suggestions = searchPeople(query);
}

// Update arranger suggestions
function updateArrangerSuggestions(index: number, field: 'vorname' | 'name') {
    const arranger = state.value.arrangiert[index];
    const query = arranger[field];
    arranger.suggestions = searchPeople(query);
}

// Select person suggestion for composer
function selectComposerSuggestion(index: number, person: { vorname: string; name: string }) {
    state.value.komponiert[index].vorname = person.vorname;
    state.value.komponiert[index].name = person.name;
    state.value.komponiert[index].suggestions = [];
}

// Select person suggestion for arranger
function selectArrangerSuggestion(index: number, person: { vorname: string; name: string }) {
    state.value.arrangiert[index].vorname = person.vorname;
    state.value.arrangiert[index].name = person.name;
    state.value.arrangiert[index].suggestions = [];
}

const schema = z.object({
    name: z.string().min(1, 'Title is required'),
    genre: z.string().min(1, 'Genre is required'),
    schwierigkeit: z.string().min(1, 'Difficulty is required'),
    jahr: z.number().nullable(),
    isdigitalisiert: z.boolean(),
    komponiert: z.array(z.object({
        vorname: z.string().min(1, 'First name is required'),
        name: z.string().min(1, 'Last name is required'),
    })).min(1, 'At least one composer is required'),
    arrangiert: z.array(z.object({
        vorname: z.string(),
        name: z.string(),
    })),
});

function addComposer() {
    state.value.komponiert.push({ vorname: '', name: '', suggestions: [] });
}

function removeComposer(index: number) {
    if (state.value.komponiert.length > 1) {
        state.value.komponiert.splice(index, 1);
    }
}

function addArranger() {
    state.value.arrangiert.push({ vorname: '', name: '', suggestions: [] });
}

function removeArranger(index: number) {
    state.value.arrangiert.splice(index, 1);
}

async function onSubmit() {
    try {
        isSubmitting.value = true;
        // TODO: Implement API call to create piece
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
        router.push('/stuecke');
    } catch (error) {
        console.error('Failed to create piece:', error);
    } finally {
        isSubmitting.value = false;
    }
}

// Add this to the script section, after the existing options
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1000 + 1 }, (_, i) => ({
    label: (currentYear - i).toString(),
    value: currentYear - i
}));
</script>

<style scoped>
.new-piece-container {
    container: mx-auto;
    padding: 2rem;
}

.new-piece-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    border-radius: 1rem;
}

.glass-panel {
    background-color: var(--color-surface);
    backdrop-filter: blur(8px);
    border: 1px solid var(--color-border);
}

.new-piece-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-text);
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid var(--color-primary);
}

.form-info-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    margin-bottom: 2rem;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
}

.info-icon {
    color: var(--color-primary);
    font-size: 1.5rem;
}

.required-field {
    color: var(--color-error);
    font-weight: bold;
}

.form-card {
    margin-bottom: 2rem;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.form-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-bottom: 2px solid var(--color-primary);
}

.section-icon {
    color: var(--color-primary);
    font-size: 1.5rem;
}

.card-header-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
}

.composer-row,
.arranger-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
    padding: 1rem;
    background-color: var(--color-background);
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
}

.composer-inputs,
.arranger-inputs {
    display: flex;
    gap: 1rem;
    flex: 1;
}

.composer-input,
.arranger-input {
    flex: 1;
}

.remove-button {
    flex-shrink: 0;
}

.add-button {
    width: 100%;
    margin-top: 0.5rem;
}

.digitized-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
}

@media (max-width: 768px) {
    .composer-inputs,
    .arranger-inputs {
        flex-direction: column;
    }

    .form-actions {
        flex-direction: column-reverse;
    }

    .form-actions button {
        width: 100%;
    }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group :deep(.u-select) {
    width: 100%;
}

.form-group :deep(.u-input) {
    width: 100%;
}

.required-field {
    color: var(--color-error);
    font-weight: bold;
    margin-left: 0.25rem;
}

.suggestions-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    margin-top: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.suggestion-item {
    width: 100%;
    padding: 0.5rem 1rem;
    text-align: left;
    transition: background-color 0.2s ease;
}

.suggestion-item:hover {
    background-color: var(--color-background);
}

.relative {
    position: relative;
}

/* Calendar styles */
:deep(.calendar) {
    border: none;
    background-color: var(--color-surface);
    padding: 1rem;
}

:deep(.calendar-header) {
    margin-bottom: 1rem;
}

:deep(.calendar-days) {
    gap: 0.5rem;
}

:deep(.calendar-day) {
    border-radius: 0.25rem;
    transition: background-color 0.2s ease;
}

:deep(.calendar-day:hover) {
    background-color: var(--color-background);
}

:deep(.calendar-day.selected) {
    background-color: var(--color-primary);
    color: white;
}
</style>
