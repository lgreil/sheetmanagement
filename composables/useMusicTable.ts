import { h, ref, computed } from "vue";
import { useState } from "#app";
import { UButton, UTooltip } from "#components";
import type { TableColumn } from "@nuxt/ui";
import type { Piece } from "~/types/music";
import DifficultyIndicator from "~/components/MusicTable/DifficultyIndicator.vue";
import DigitizedIndicator from "~/components/MusicTable/DigitizedIndicator.vue";
import NameList from "~/components/MusicTable/NameList.vue";

export function useMusicTable() {
  const globalFilter = useState("globalFilter", () => "");

  // Add explicit types to the parameters of the filterData function
  const filterData = (data: Piece[], filterValue: string): Piece[] => {
    if (!filterValue) return data;
    const searchLower = filterValue.toLowerCase();
    return data.filter((row: Piece) => {
      const nameMatch = String(row.name || "").toLowerCase().includes(searchLower);
      const genreMatch = String(row.genre || "").toLowerCase().includes(searchLower);
      const composerMatch = (row.composer_names || []).some((name: string) =>
        name.toLowerCase().includes(searchLower)
      );
      const arrangerMatch = (row.arranger_names || []).some((name: string) =>
        name.toLowerCase().includes(searchLower)
      );
      return nameMatch || genreMatch || composerMatch || arrangerMatch;
    });
  };

  const filteredData = computed(() => {
    const data = useState<Piece[]>("pieces").value;
    return filterData(data, globalFilter.value);
  });

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
          color: isSorted ? "primary" : "neutral",
          class: "font-medium",
          onClick: () => column.toggleSorting(isSorted === "asc"),
        },
        { default: () => label },
      );
    };
  }

  function getDifficultyValue(difficulty: string): number {
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

  function extractLastName(fullName: string): string {
    const trimmedName = fullName.trim();
    if (/^[A-Z]\.[A-Z]\./.test(trimmedName)) {
      const parts = trimmedName.split(" ");
      return parts.length > 1 ? parts[parts.length - 1] : trimmedName;
    }
    const nameParts = trimmedName.split(" ");
    return nameParts.length > 1 ? nameParts[nameParts.length - 1] : trimmedName;
  }

  function nameArraySortingFn(rowA: any, rowB: any, columnId: string): number {
    const namesA = (rowA.getValue(columnId) as string[]) || [];
    const namesB = (rowB.getValue(columnId) as string[]) || [];
    const nameA = namesA.length > 0 ? namesA[0] : "";
    const nameB = namesB.length > 0 ? namesB[0] : "";
    const lastNameA = extractLastName(nameA).toLowerCase();
    const lastNameB = extractLastName(nameB).toLowerCase();
    if (lastNameA !== lastNameB) {
      return lastNameA.localeCompare(lastNameB);
    }
    return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
  }

  const getFilteredRowsModel = (
    rows: any[],
    columnIds: string[],
    filterValue: string,
  ) => {
    if (!filterValue) return rows;
    const searchLower = filterValue.toLowerCase();
    return rows.filter((row) => {
      const nameMatch = String(row.getValue("name") || "")
        .toLowerCase()
        .includes(searchLower);
      const genreMatch = String(row.getValue("genre") || "")
        .toLowerCase()
        .includes(searchLower);
      const yearMatch = String(row.getValue("jahr") || "")
        .toLowerCase()
        .includes(searchLower);
      const difficultyMatch = String(row.getValue("schwierigkeit") || "")
        .toLowerCase()
        .includes(searchLower);
      const composerNames = (row.getValue("composer_names") as string[]) || [];
      const composerMatch = composerNames.some((name) =>
        name.toLowerCase().includes(searchLower),
      );
      const arrangerNames = (row.getValue("arranger_names") as string[]) || [];
      const arrangerMatch = arrangerNames.some((name) =>
        name.toLowerCase().includes(searchLower),
      );
      return (
        nameMatch ||
        genreMatch ||
        yearMatch ||
        difficultyMatch ||
        composerMatch ||
        arrangerMatch
      );
    });
  };

  function getGenreBadgeClass(genre: string): string {
    switch (genre.toLowerCase()) {
      case "traditionell":
        return "genre-badge traditionell";
      case "klassik":
        return "genre-badge klassik";
      case "barock":
        return "genre-badge barock";
      case "moderne klassik":
        return "genre-badge moderne-klassik";
      case "romantik":
        return "genre-badge romantik";
      case "musicals":
        return "genre-badge musicals";
      case "pop / rock / modern":
        return "genre-badge pop-rock-modern";
      case "weihnachtsmusik":
        return "genre-badge weihnachtsmusik";
      case "filmmusik":
        return "genre-badge filmmusik";
      default:
        return "genre-badge";
    }
  }

  const columns: TableColumn<Piece>[] = [
    {
      accessorKey: "name",
      header: createSortableHeader("Name"),
      cell: ({ row }) =>
        h("div", { class: "font-medium" }, row.getValue("name") || ""),
      enableSorting: true,
    },
    {
      accessorKey: "genre",
      header: createSortableHeader("Genre"),
      cell: ({ row }) => {
        const genre = row.getValue("genre") as string;
        return h("span", { class: getGenreBadgeClass(genre) }, [genre || "-"]);
      },
      enableSorting: true,
    },
    {
      accessorKey: "jahr",
      header: createSortableHeader("Year"),
      cell: ({ row }) => {
        const value = row.getValue("jahr") as number;
        return h("span", { class: "text-center block" }, [
          value && value !== 0 ? value.toString() : "-",
        ]);
      },
      enableSorting: true,
    },
    {
      accessorKey: "schwierigkeit",
      header: createSortableHeader("Difficulty"),
      cell: ({ row }) =>
        h(DifficultyIndicator, {
          difficulty: String(row.getValue("schwierigkeit") || ""),
        }),
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const difficultyA = getDifficultyValue(rowA.getValue("schwierigkeit"));
        const difficultyB = getDifficultyValue(rowB.getValue("schwierigkeit"));
        return difficultyA - difficultyB;
      },
    },
    {
      accessorKey: "isdigitalisiert",
      header: createSortableHeader("Digitized"),
      cell: ({ row }) =>
        h(DigitizedIndicator, {
          isDigitized: row.getValue("isdigitalisiert") as boolean,
        }),
      enableSorting: true,
    },
    
    // Add a column for 'komponiert' to handle the provided format
    {
      accessorKey: "komponiert",
      header: createSortableHeader("Composer(s)"),
      cell: ({ row }) => {
        const composers = (row.getValue("komponiert") as { pid: number; vorname: string; name: string }[]) || [];
        return composers.length > 0
          ? composers.map(composer => `${composer.vorname} ${composer.name}`).join(", ")
          : "-";
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const composersA = ((rowA.getValue("komponiert") as { pid: number; vorname: string; name: string }[]) || []).map(composer => `${composer.vorname} ${composer.name}`).join(", ");
        const composersB = ((rowB.getValue("komponiert") as { pid: number; vorname: string; name: string }[]) || []).map(composer => `${composer.vorname} ${composer.name}`).join(", ");
        return composersA.localeCompare(composersB);
      },
    },
    // Update the cell function to handle the provided format of 'arrangiert' and 'komponiert'
    {
      accessorKey: "arrangiert",
      header: createSortableHeader("Arranger(s)"),
      cell: ({ row }) => {
        const arrangers = (row.getValue("arrangiert") as { pid: number; vorname: string; name: string }[]) || [];
        return arrangers.length > 0
          ? arrangers.map(arranger => `${arranger.vorname} ${arranger.name}`).join(", ")
          : "-";
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const arrangersA = ((rowA.getValue("arrangiert") as { pid: number; vorname: string; name: string }[]) || []).map(arranger => `${arranger.vorname} ${arranger.name}`).join(", ");
        const arrangersB = ((rowB.getValue("arrangiert") as { pid: number; vorname: string; name: string }[]) || []).map(arranger => `${arranger.vorname} ${arranger.name}`).join(", ");
        return arrangersA.localeCompare(arrangersB);
      },
    },
  ];

  return { columns, getFilteredRowsModel, globalFilter, filteredData };
}
