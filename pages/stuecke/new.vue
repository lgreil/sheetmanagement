<template>
    <div class="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div class="container mx-auto px-8 py-32">
            <div class="max-w-4xl mx-auto">
                <!-- Header -->
                <div class="text-center mb-16">
                    <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        Create New Piece
                    </h1>
                    <p class="text-lg text-gray-600 dark:text-gray-400">
                        Add a new piece to your collection
                    </p>
                </div>

                <!-- Form -->
                <div class="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl p-10 shadow-2xl">
                    <form @submit.prevent="handleSubmit" class="space-y-8">
                        <!-- Basic Information -->
                        <div class="space-y-6">
                            <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                                Basic Information
                            </h2>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Name
                                    </label>
                                    <UInput
                                        v-model="piece.name"
                                        placeholder="Enter piece name"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                    <div v-if="suggestedTitles.length > 0" class="mt-2">
                                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Similar titles:</p>
                                        <div class="flex flex-wrap gap-2">
                                            <UBadge
                                                v-for="title in suggestedTitles"
                                                :key="title"
                                                color="gray"
                                                variant="soft"
                                                class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                                @click="piece.name = title"
                                            >
                                                {{ title }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Genre
                                    </label>
                                    <UInput
                                        v-model="piece.genre"
                                        placeholder="Enter genre"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                    <div v-if="suggestedGenres.length > 0" class="mt-2">
                                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Existing genres:</p>
                                        <div class="flex flex-wrap gap-2">
                                            <UBadge
                                                v-for="genre in suggestedGenres"
                                                :key="genre"
                                                color="gray"
                                                variant="soft"
                                                class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                                @click="piece.genre = genre"
                                            >
                                                {{ genre }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Difficulty
                                    </label>
                                    <USelect
                                        v-model="piece.schwierigkeit"
                                        :options="difficultyOptions"
                                        placeholder="Select difficulty"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                </div>

                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Year
                                    </label>
                                    <UInput
                                        v-model="piece.jahr"
                                        type="number"
                                        placeholder="Enter year"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                </div>

                                <div>
                                    <label class="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                                        Digitalized
                                    </label>
                                    <div class="flex items-center space-x-4">
                                        <UToggle
                                            v-model="piece.isdigitalisiert"
                                            color="emerald"
                                        />
                                        <span class="text-gray-600 dark:text-gray-400">
                                            {{ piece.isdigitalisiert ? 'Yes' : 'No' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Arrangers -->
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                                    Arrangers
                                </h2>
                                <UButton
                                    color="gray"
                                    variant="ghost"
                                    @click="addArranger"
                                    class="text-emerald-500 hover:text-emerald-600"
                                >
                                    <UIcon name="i-heroicons-plus" class="h-5 w-5 mr-2" />
                                    Add Arranger
                                </UButton>
                            </div>

                            <div v-for="(arranger, index) in piece.arrangiert" :key="index" class="flex items-center space-x-4">
                                <div class="flex-1">
                                    <UInput
                                        v-model="arranger.vorname"
                                        placeholder="First name"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                    <div v-if="suggestedArrangerFirstNames.length > 0" class="mt-2">
                                        <div class="flex flex-wrap gap-2">
                                            <UBadge
                                                v-for="name in suggestedArrangerFirstNames"
                                                :key="name"
                                                color="gray"
                                                variant="soft"
                                                class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                                @click="arranger.vorname = name"
                                            >
                                                {{ name }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <UInput
                                        v-model="arranger.name"
                                        placeholder="Last name"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                    <div v-if="suggestedArrangerLastNames.length > 0" class="mt-2">
                                        <div class="flex flex-wrap gap-2">
                                            <UBadge
                                                v-for="name in suggestedArrangerLastNames"
                                                :key="name"
                                                color="gray"
                                                variant="soft"
                                                class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                                @click="arranger.name = name"
                                            >
                                                {{ name }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>
                                <UButton
                                    color="red"
                                    variant="ghost"
                                    @click="removeArranger(index)"
                                    class="text-red-500 hover:text-red-600"
                                >
                                    <UIcon name="i-heroicons-trash" class="h-5 w-5" />
                                </UButton>
                            </div>
                        </div>

                        <!-- Composers -->
                        <div class="space-y-6">
                            <div class="flex items-center justify-between">
                                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                                    Composers
                                </h2>
                                <UButton
                                    color="gray"
                                    variant="ghost"
                                    @click="addComposer"
                                    class="text-emerald-500 hover:text-emerald-600"
                                >
                                    <UIcon name="i-heroicons-plus" class="h-5 w-5 mr-2" />
                                    Add Composer
                                </UButton>
                            </div>

                            <div v-for="(composer, index) in piece.komponiert" :key="index" class="flex items-center space-x-4">
                                <div class="flex-1">
                                    <UInput
                                        v-model="composer.vorname"
                                        placeholder="First name (optional)"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                    <div v-if="suggestedComposerFirstNames.length > 0" class="mt-2">
                                        <div class="flex flex-wrap gap-2">
                                            <UBadge
                                                v-for="name in suggestedComposerFirstNames"
                                                :key="name"
                                                color="gray"
                                                variant="soft"
                                                class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                                @click="composer.vorname = name"
                                            >
                                                {{ name }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <UInput
                                        v-model="composer.name"
                                        placeholder="Last name"
                                        :ui="{
                                            base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none border-0 form-input rounded-xl placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50 bg-white dark:bg-gray-900 px-4 py-4 text-base transition-all duration-200',
                                        }"
                                    />
                                    <div v-if="suggestedComposerLastNames.length > 0" class="mt-2">
                                        <div class="flex flex-wrap gap-2">
                                            <UBadge
                                                v-for="name in suggestedComposerLastNames"
                                                :key="name"
                                                color="gray"
                                                variant="soft"
                                                class="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                                                @click="composer.name = name"
                                            >
                                                {{ name }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>
                                <UButton
                                    color="red"
                                    variant="ghost"
                                    @click="removeComposer(index)"
                                    class="text-red-500 hover:text-red-600"
                                >
                                    <UIcon name="i-heroicons-trash" class="h-5 w-5" />
                                </UButton>
                            </div>
                        </div>

                        <!-- Submit Button -->
                        <div class="flex justify-end space-x-4">
                            <UButton
                                color="gray"
                                variant="ghost"
                                @click="router.push('/stuecke')"
                                class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                            >
                                Cancel
                            </UButton>
                            <UButton
                                type="submit"
                                color="primary"
                                :loading="isLoading"
                                class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 text-lg font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                            >
                                Create Piece
                            </UButton>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePieces } from '~/composables/usePieces';

const router = useRouter();
const { createPiece, isLoading, pieces } = usePieces();

const difficultyOptions = [
    { label: 'Very Easy', value: 'very easy' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' },
    { label: 'Very Hard', value: 'very hard' }
];

const piece = ref({
    name: '',
    genre: '',
    schwierigkeit: '',
    jahr: '',
    isdigitalisiert: false,
    arrangiert: [],
    komponiert: []
});

// Computed properties for suggestions
const suggestedTitles = computed(() => {
    if (!piece.value.name) return [];
    const searchTerm = piece.value.name.toLowerCase();
    return pieces.value
        .filter(p => p.name.toLowerCase().includes(searchTerm))
        .map(p => p.name)
        .slice(0, 5);
});

const suggestedGenres = computed(() => {
    if (!piece.value.genre) return [];
    const searchTerm = piece.value.genre.toLowerCase();
    return [...new Set(pieces.value
        .map(p => p.genre)
        .filter(g => g && g.toLowerCase().includes(searchTerm)))]
        .slice(0, 5);
});

const suggestedArrangerFirstNames = computed(() => {
    const searchTerm = piece.value.arrangiert[piece.value.arrangiert.length - 1]?.vorname?.toLowerCase() || '';
    if (!searchTerm) return [];
    return [...new Set(pieces.value
        .flatMap(p => p.arrangiert || [])
        .map(a => a.vorname)
        .filter(n => n && n.toLowerCase().includes(searchTerm)))]
        .slice(0, 5);
});

const suggestedArrangerLastNames = computed(() => {
    const searchTerm = piece.value.arrangiert[piece.value.arrangiert.length - 1]?.name?.toLowerCase() || '';
    if (!searchTerm) return [];
    return [...new Set(pieces.value
        .flatMap(p => p.arrangiert || [])
        .map(a => a.name)
        .filter(n => n && n.toLowerCase().includes(searchTerm)))]
        .slice(0, 5);
});

const suggestedComposerFirstNames = computed(() => {
    const searchTerm = piece.value.komponiert[piece.value.komponiert.length - 1]?.vorname?.toLowerCase() || '';
    if (!searchTerm) return [];
    return [...new Set(pieces.value
        .flatMap(p => p.komponiert || [])
        .map(c => c.vorname)
        .filter(n => n && n.toLowerCase().includes(searchTerm)))]
        .slice(0, 5);
});

const suggestedComposerLastNames = computed(() => {
    const searchTerm = piece.value.komponiert[piece.value.komponiert.length - 1]?.name?.toLowerCase() || '';
    if (!searchTerm) return [];
    return [...new Set(pieces.value
        .flatMap(p => p.komponiert || [])
        .map(c => c.name)
        .filter(n => n && n.toLowerCase().includes(searchTerm)))]
        .slice(0, 5);
});

const addArranger = () => {
    piece.value.arrangiert.push({
        pid: Date.now(),
        vorname: '',
        name: ''
    });
};

const removeArranger = (index) => {
    piece.value.arrangiert.splice(index, 1);
};

const addComposer = () => {
    piece.value.komponiert.push({
        pid: Date.now(),
        vorname: '',
        name: ''
    });
};

const removeComposer = (index) => {
    piece.value.komponiert.splice(index, 1);
};

const handleSubmit = async () => {
    try {
        // Validate required fields
        if (!piece.value.name || !piece.value.genre) {
            throw new Error('Name and genre are required');
        }

        // Validate that at least one composer is provided
        if (piece.value.komponiert.length === 0) {
            throw new Error('At least one composer is required');
        }

        // Validate that all composers have a last name
        if (piece.value.komponiert.some(composer => !composer.name)) {
            throw new Error('All composers must have a last name');
        }

        // Validate that all arrangers have both first and last names
        if (piece.value.arrangiert.some(arranger => !arranger.vorname || !arranger.name)) {
            throw new Error('All arrangers must have both first and last names');
        }

        // Create the piece using the usePieces composable
        await createPiece(piece.value);
        
        // Redirect to the pieces list
        router.push('/stuecke');
    } catch (error) {
        console.error('Failed to create piece:', error);
        // Here you could add a toast notification or other error handling
    }
};
</script>

<style scoped>
.min-h-screen {
    animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
</style> 