import { watch } from "vue";
import type { Piece } from "~/types/Types";
import { useFetch, useState, useRuntimeConfig } from "#app";
import dummyMusicData from "~/content/dummyMusicData";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export function useMusicData(initialPageIndex = 1, initialPageSize = 10) {
  const config = useRuntimeConfig();
  const pageIndex = useState("pageIndex", () => initialPageIndex);
  const pageSize = useState("pageSize", () => initialPageSize);
  const pieces = useState<Piece[]>("pieces", () => []);
  const totalItems = useState<number>("totalItems", () => 0);
  const lastPage = useState<number>("lastPage", () => 1);
  const pieceCache = useState<Record<string, Piece>>("pieceCache", () => ({}));
  const loading = useState("loading", () => false);
  const error = useState<Error | null>("error", () => null);
  const isUsingDummyData = useState("isUsingDummyData", () => false);

  async function fetchPieces() {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    isUsingDummyData.value = false;

    try {
      const apiUrl = config.public.API_URL;

      if (!apiUrl) {
        console.info("No API URL configured, using dummy data");
        pieces.value = dummyMusicData;
        isUsingDummyData.value = true;
        return;
      }

      const { data, error: fetchError } = await useFetch<
        PaginatedResponse<Piece>
      >(`${apiUrl}/stuecke`, {
        immediate: false,
        lazy: true,
        query: {
          page: pageIndex.value,
          limit: pageSize.value,
        },
        default: () => ({
          data: [],
          meta: { total: 0, page: 1, lastPage: 1, limit: 10 },
        }),
      });

      if (fetchError.value) {
        throw fetchError.value;
      }

      if (
        data.value &&
        Array.isArray(data.value.data) &&
        data.value.data.length > 0
      ) {
        pieces.value = data.value.data;
        totalItems.value = data.value.meta.total;
        lastPage.value = data.value.meta.lastPage;

        // Cache the pieces by their ID
        data.value.data.forEach((piece: Piece) => {
          if (piece.stid) {
            pieceCache.value[piece.stid.toString()] = piece;
          }
        });
      } else {
        // Only show warning in development
        if (config.public.dev) {
          console.info("Using dummy data for development");
        }
        pieces.value = dummyMusicData;
        isUsingDummyData.value = true;
      }
    } catch (err) {
      console.error("Error fetching pieces:", err);
      error.value = err as Error;
      pieces.value = dummyMusicData;
      isUsingDummyData.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPieceById(id: string): Promise<Piece | null> {
    if (pieceCache.value[id]) {
      return pieceCache.value[id];
    }

    if (!config.public.API_URL) {
      const dummyPiece = dummyMusicData.find(
        (p: Piece) => p.stid.toString() === id,
      );
      if (dummyPiece) {
        pieceCache.value[id] = dummyPiece;
        return dummyPiece;
      }
      return null;
    }

    try {
      const { data, error: fetchError } = await useFetch<{ data: Piece }>(
        `${config.public.API_URL}/stuecke/${id}`,
        {
          immediate: false,
          lazy: true,
        },
      );

      if (fetchError.value) {
        throw fetchError.value;
      }

      if (data.value && data.value.data) {
        pieceCache.value[id] = data.value.data;
        return data.value.data;
      }
    } catch (err) {
      console.error(`Error fetching piece with ID ${id}:`, err);
      // Fallback to dummy data in case of error
      const dummyPiece = dummyMusicData.find(
        (p: Piece) => p.stid.toString() === id,
      );
      if (dummyPiece) {
        pieceCache.value[id] = dummyPiece;
        return dummyPiece;
      }
    }

    return null;
  }

  // Only fetch when pagination changes if we already have data
  watch([pageIndex, pageSize], () => {
    if (pieces.value.length > 0 || loading.value) {
      fetchPieces();
    }
  });

  return {
    pieces,
    loading,
    error,
    fetchPieces,
    fetchPieceById,
    pageIndex,
    pageSize,
    totalItems,
    lastPage,
    isUsingDummyData,
  };
}
