<template>
    <template v-if="names.length === 0"> - </template>
    <template v-else-if="names.length === 1">
        {{ names[0] }}
    </template>
    <UTooltip v-else :text="names.join(', ')">
        <div>
            <span>{{ names[0] }}</span>
            <span class="text-xs text-gray-500 ml-1"
                >+{{ names.length - 1 }} more</span
            >
        </div>
    </UTooltip>
</template>

<script setup lang="ts">
import { UTooltip } from "#components";
const props = defineProps({
    names: {
        type: Array as () => string[],
        default: () => [],
    },
});
</script>
