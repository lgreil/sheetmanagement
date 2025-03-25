<template>
    <div class="flex flex-col md:flex-row items-center justify-between px-4 py-3" v-auto-animate>
        <div class="text-sm text-gray-700 dark:text-gray-300 mb-2 md:mb-0">
            Showing {{ startItem }} – {{ endItem }} of {{ totalItems }} pieces
        </div>
        <div class="flex flex-wrap items-center gap-2" v-auto-animate>
            <UPagination v-model:page="localPage" color="neutral" variant="subtle" :total="totalPages" />
            <div class="page-size-container ml-2">
                <USelect v-model="localPageSize" :options="pageSizeOptions" class="page-size-selector w-36" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

const props = defineProps({
    pageIndex: {
        type: Number,
        default: 0,
    },
    pageSize: {
        type: Number,
        default: 10,
    },
    totalItems: {
        type: Number,
        required: true,
    },
});

const emit = defineEmits(["update:pageIndex", "update:pageSize"]);

// Correctly use useState for local state
const localPage = useState<number>("localPage", () => props.pageIndex + 1);
const localPageSize = useState<number>("localPageSize", () => props.pageSize);

// Sync props with local state
watch(
    () => props.pageIndex,
    (newVal) => {
        localPage.value = newVal + 1;
    },
    { immediate: true },
);
watch(
    () => props.pageSize,
    (newVal) => {
        localPageSize.value = newVal;
    },
    { immediate: true },
);

// Emit changes to parent (convert back to 0-index)
watch(localPage, (newVal) => {
    emit("update:pageIndex", newVal - 1);
});

// When page size changes, reset to first page
watch(localPageSize, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        emit("update:pageSize", newVal);
        localPage.value = 1;
        emit("update:pageIndex", 0);
    }
});

// Computed pagination summary
const totalPages = computed(() =>
    Math.max(1, Math.ceil(props.totalItems / localPageSize.value)),
);
const startItem = computed(() =>
    props.totalItems === 0 ? 0 : props.pageIndex * localPageSize.value + 1,
);
const endItem = computed(() => {
    const end = (props.pageIndex + 1) * localPageSize.value;
    return end > props.totalItems ? props.totalItems : end;
});

const pageSizeOptions = [
    { label: "10 per page", value: 10 },
    { label: "20 per page", value: 20 },
    { label: "50 per page", value: 50 },
];
</script>

<style scoped>
.page-size-selector {
    min-width: 120px;
}
</style>
