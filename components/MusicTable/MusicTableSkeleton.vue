<template>
    <div
        class="music-table-container rounded-lg overflow-hidden"
        v-auto-animate
    >
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-border">
                        <th
                            v-for="(width, i) in columnWidths"
                            :key="i"
                            class="p-3"
                        >
                            <USkeleton class="h-4" :class="width" />
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="n in 10" :key="n" class="border-b border-border">
                        <td
                            v-for="(content, i) in rowContents"
                            :key="i"
                            class="p-3"
                        >
                            <template v-if="content.type === 'text'">
                                <USkeleton class="h-4" :class="content.width" />
                            </template>
                            <template v-else-if="content.type === 'badge'">
                                <USkeleton
                                    class="h-6 rounded-full"
                                    :class="content.width"
                                />
                            </template>
                            <template v-else-if="content.type === 'indicator'">
                                <USkeleton class="h-3 w-3 rounded-full" />
                            </template>
                            <template v-else-if="content.type === 'actions'">
                                <div class="flex gap-2">
                                    <USkeleton
                                        v-for="j in 2"
                                        :key="j"
                                        class="h-8 w-8 rounded-lg"
                                    />
                                </div>
                            </template>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination skeleton -->
        <div
            class="p-4 flex items-center justify-between border-t border-border"
        >
            <USkeleton class="h-5 w-32" />
            <div class="flex items-center gap-4">
                <div class="flex gap-1">
                    <USkeleton
                        v-for="n in 5"
                        :key="n"
                        class="h-9 w-9 rounded-lg"
                    />
                </div>
                <USkeleton class="h-9 w-32 rounded-lg" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// Column widths for the header
const columnWidths = [
    "w-[200px]", // Name
    "w-[120px]", // Genre
    "w-[150px]", // Composer
    "w-[100px]", // Difficulty
    "w-[80px]", // Digital
    "w-[150px]", // Arranger
    "w-[100px]", // Actions
];

// Row content specifications
const rowContents = [
    { type: "text", width: "w-[180px]" }, // Name
    { type: "badge", width: "w-[100px]" }, // Genre
    { type: "text", width: "w-[130px]" }, // Composer
    { type: "badge", width: "w-[80px]" }, // Difficulty
    { type: "indicator", width: "w-[60px]" }, // Digital
    { type: "text", width: "w-[130px]" }, // Arranger
    { type: "actions", width: "w-[90px]" }, // Actions
];
</script>

<style scoped>
.music-table-container {
    background: linear-gradient(
        to bottom right,
        var(--color-surface),
        var(--color-background)
    );
    animation: shimmer 2s infinite linear;
    background-size: 200% 200%;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>
