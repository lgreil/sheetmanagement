<template>
    <div class="container">
        <div class="filter-section">
            <UInput
                v-model="globalFilter"
                class="filter-input"
                placeholder="Filter..."
            />
        </div>

        <div class="table-container">
            <UTable
                ref="table"
                v-model:pagination="pagination"
                :pagination-options="{
                    getPaginationRowModel: getPaginationRowModel(),
                }"
                v-model:global-filter="globalFilter"
                v-model:sorting="sorting"
                :loading="status === 'pending'"
                loading-color="primary"
                loading-animation="carousel"
                :data="data || []"
                :columns="columns"
                class="data-table"
            >
            </UTable>
        </div>

        <div class="pagination-section">
            <UPagination
                :model-value="pagination.pageIndex + 1"
                :default-page="pagination.pageIndex + 1"
                :items-per-page="pagination.pageSize"
                :total="data ? data.length : 0"
                @update:page="(p: number) => (pagination.pageIndex = p - 1)"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { UButton, UInput, UPagination, UTable, UTooltip } from "#components";
import { getPaginationRowModel } from "@tanstack/vue-table";
import type { TableColumn } from "@nuxt/ui";
import { h } from "vue";

type Stueck = {
    stid: number;
    name: string;
    genre: string;
    jahr: number;
    schwierigkeit: string;
    isdigitalisiert: boolean;
    composer_names: string[];
    arranger_names: string[];
};

const globalFilter = useState("globalFilter", () => "");

const { status, data } = await useFetch<Piece[]>(
    `${process.env.API_URL}/stuecke`,
);
const sorting = useState("sorting", () => [
    {
        id: "name",
        desc: false,
    },
]);

function createSortableHeader(label: string) {
    return ({ column }: { column: any }) => {
        const isSorted = column.getIsSorted();

        return h(
            UButton,
            {
                label,
                icon: isSorted
                    ? isSorted === "asc"
                        ? "i-lucide-arrow-up"
                        : "i-lucide-arrow-down"
                    : "i-lucide-arrow-up-down",
                variant: "ghost",
                class: "header-button",
                onClick: () => column.toggleSorting(isSorted === "asc"),
            },
            label,
        );
    };
}

function getDifficultyClass(difficulty: string) {
    switch (difficulty) {
        case "easy":
            return "difficulty-easy quarter-width";
        case "medium":
            return "difficulty-medium half-width";
        case "hard":
            return "difficulty-hard three-quarter-width";
        case "very hard":
            return "difficulty-very-hard full-width";
        case "Unknown":
            return "difficulty-unknown no-width";
        default:
            return "difficulty-unknown no-width";
    }
}

function getDifficultyPercentage(difficulty: string) {
    switch (difficulty) {
        case "easy":
            return 25;
        case "medium":
            return 50;
        case "hard":
            return 75;
        case "very hard":
            return 100;
        default:
            return 0;
    }
}

function getDifficultyValue(difficulty: string) {
    switch (difficulty) {
        case "easy":
            return 1;
        case "medium":
            return 2;
        case "hard":
            return 3;
        case "very hard":
            return 4;
        default:
            return 0;
    }
}

const columns: TableColumn<Stueck>[] = [
    {
        accessorKey: "name",
        header: createSortableHeader("Name"),
        cell: ({ row }) => row.getValue("name") || "",
        enableSorting: true,
    },
    {
        accessorKey: "genre",
        header: createSortableHeader("Genre"),
        cell: ({ row }) => row.getValue("genre") || "",
        enableSorting: true,
    },
    {
        accessorKey: "jahr",
        header: createSortableHeader("Year"),
        cell: ({ row }) => {
            const value = row.getValue("jahr") as number;
            return value && value !== 0 ? value : "";
        },
        enableSorting: true,
    },
    {
        accessorKey: "schwierigkeit",
        header: createSortableHeader("Difficulty"),
        cell: ({ row }) => {
            const difficulty = row.getValue("schwierigkeit") || "";
            const percentage = getDifficultyPercentage(difficulty);
            const tooltipContent = `Difficulty: ${difficulty}`;

            return h(
                UTooltip,
                { content: tooltipContent },
                h(
                    "div",
                    {
                        class: "progress-bar",
                        "aria-valuenow": percentage,
                        "aria-valuemin": 0,
                        "aria-valuemax": 100,
                        role: "progressbar",
                    },
                    [
                        h("div", {
                            class: `progress-bar-fill ${getDifficultyClass(difficulty)}`,
                            style: { width: `${percentage}%` },
                        }),
                    ],
                ),
            );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
            const difficultyA = getDifficultyValue(
                rowA.getValue("schwierigkeit"),
            );
            const difficultyB = getDifficultyValue(
                rowB.getValue("schwierigkeit"),
            );
            return difficultyA - difficultyB;
        },
    },
    {
        accessorKey: "isdigitalisiert",
        header: createSortableHeader("Digitized"),
        cell: ({ row }) => row.getValue("isdigitalisiert"),
        enableSorting: true,
    },
    {
        accessorKey: "composer_names",
        header: createSortableHeader("Composer(s)"),
        cell: ({ row }) => {
            const composers = row.getValue("composer_names") as string[];
            return composers.length > 0 ? composers.join(", ") : "";
        },
        enableSorting: true,
    },
    {
        accessorKey: "arranger_names",
        header: createSortableHeader("Arranger(s)"),
        cell: ({ row }) => {
            const arrangers = row.getValue("arranger_names") as string[];
            return arrangers.length > 0 ? arrangers.join(", ") : "";
        },
        enableSorting: true,
    },
];

const pagination = useState("pagination", () => ({
    pageIndex: 0,
    pageSize: 5,
}));
</script>

<style scoped>
.container {
    width: 90%;
    max-width: 80rem;
    margin: 0 auto;
}

.filter-section {
    display: flex;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid var(--ui-border-accented);
    background-color: #fff;
    border-radius: 0.5rem 0.5rem 0 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.filter-input {
    max-width: 24rem;
}

.table-container {
    overflow-x: auto;
    background-color: #fff;
    border-radius: 0 0 0.5rem 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.data-table {
    width: 100%;
    table-layout: fixed;
}

.pagination-section {
    display: flex;
    justify-content: center;
    border-top: 1px solid var(--ui-border);
    padding-top: 1rem;
    background-color: #fff;
    border-radius: 0 0 0.5rem 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.header-button {
    margin-left: -0.625rem;
    margin-right: -0.625rem;
}

.progress-bar {
    position: relative;
    height: 1rem;
    border-radius: 9999px;
    overflow: hidden;
    background-color: #e5e7eb;
}

.progress-bar-fill {
    height: 100%;
    transition: all 0.3s;
}

.difficulty-easy {
    background-color: #48bb78;
}

.difficulty-medium {
    background-color: #ecc94b;
}

.difficulty-hard {
    background-color: #f56565;
}

.difficulty-very-hard {
    background-color: #742a2a;
}

.difficulty-unknown {
    background-color: #a0aec0;
}

.quarter-width {
    width: 25%;
}

.half-width {
    width: 50%;
}

.three-quarter-width {
    width: 75%;
}

.full-width {
    width: 100%;
}

.no-width {
    width: 0;
}

@media (prefers-color-scheme: dark) {
    .filter-section,
    .table-container,
    .pagination-section {
        background-color: #1a1a1a;
    }

    .progress-bar {
        background-color: #4a5568;
    }
}
</style>
