import { watch } from "vue";
import type { Piece } from "~/types/Types";
import { useFetch, useRuntimeConfig } from "#app";
import { ref } from "vue";
import { useDebounceFn } from "@vueuse/core";
import piecesData from "~/server/data/pieces.json";

// Use actual data from pieces.json
const actualMusicData: Piece[] = (piecesData as unknown as { pieces: Piece[] }).pieces;

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
  const pieces = ref<Piece[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const pageIndex = ref(initialPageIndex);
  const pageSize = ref(initialPageSize);
  const totalItems = ref(0);
  const lastPage = ref(1);
  const isUsingDummyData = ref(false);
  const pieceCache = ref<Record<string, Piece>>({});
  const fetchCache = ref<Record<string, { data: any; timestamp: number }>>({});

  // Cache key generator for fetch requests
  const getFetchCacheKey = (page: number, limit: number) => `${page}-${limit}`;

  async function fetchPieces() {
    if (loading.value) return;

    loading.value = true;
    error.value = null;

    try {
      const apiUrl = config.public.API_URL;
      console.log("API URL:", apiUrl); // Debug log

      if (!apiUrl) {
        console.info("No API URL configured, using actual data from pieces.json");
        pieces.value = actualMusicData;
        totalItems.value = actualMusicData.length;
        lastPage.value = Math.ceil(actualMusicData.length / pageSize.value);
        isUsingDummyData.value = true;
        loading.value = false;
        return;
      }

      const cacheKey = getFetchCacheKey(pageIndex.value, pageSize.value);
      const cached = fetchCache.value[cacheKey];

      // Check if we have a valid cached response (less than 5 minutes old)
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        pieces.value = cached.data.data;
        totalItems.value = cached.data.meta.total;
        lastPage.value = cached.data.meta.lastPage;
        loading.value = false;
        return;
      }

      console.log("Fetching from API..."); // Debug log

      // Ensure the API URL is properly formatted
      const url = apiUrl.endsWith("/")
        ? `${apiUrl}stuecke`
        : `${apiUrl}/stuecke`;

      const { data: responseData } = await useFetch<PaginatedResponse<Piece>>(
        url,
        {
          query: {
            page: pageIndex.value,
            limit: pageSize.value,
          },
        },
      );

      const response = responseData.value;
      console.log("API Response:", response); // Debug log

      if (
        response &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        pieces.value = response.data;
        totalItems.value = response.meta.total;
        lastPage.value = response.meta.lastPage;

        // Cache the response
        fetchCache.value[cacheKey] = {
          data: response,
          timestamp: Date.now(),
        };

        // Cache the pieces by their ID
        response.data.forEach((piece: Piece) => {
          if (piece.stid) {
            pieceCache.value[piece.stid.toString()] = piece;
          }
        });
      } else {
        console.info("No data from API, using actual data from pieces.json"); // Debug log
        pieces.value = actualMusicData;
        totalItems.value = actualMusicData.length;
        lastPage.value = Math.ceil(actualMusicData.length / pageSize.value);
        isUsingDummyData.value = true;
      }
    } catch (err) {
      console.error("Error fetching pieces:", err);
      error.value = err as Error;
      pieces.value = actualMusicData;
      totalItems.value = actualMusicData.length;
      lastPage.value = Math.ceil(actualMusicData.length / pageSize.value);
      isUsingDummyData.value = true;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPieceById(id: string): Promise<Piece | null> {
    // Check cache first
    if (pieceCache.value[id]) {
      return pieceCache.value[id];
    }

    if (!config.public.API_URL) {
      const actualPiece = actualMusicData.find(
        (p: Piece) => p.stid.toString() === id,
      );
      if (actualPiece) {
        pieceCache.value[id] = actualPiece;
        return actualPiece;
      }
      return null;
    }

    try {
      // Ensure the API URL is properly formatted
      const apiUrl = config.public.API_URL;
      const url = apiUrl.endsWith("/")
        ? `${apiUrl}stuecke/${id}`
        : `${apiUrl}/stuecke/${id}`;

      const { data } = await useFetch<{ data: Piece }>(url);
      const response = data.value;

      if (response && response.data) {
        pieceCache.value[id] = response.data;
        return response.data;
      }
    } catch (err) {
      console.error(`Error fetching piece with ID ${id}:`, err);
      // Fallback to actual data in case of error
      const actualPiece = actualMusicData.find(
        (p: Piece) => p.stid.toString() === id,
      );
      if (actualPiece) {
        pieceCache.value[id] = actualPiece;
        return actualPiece;
      }
    }

    return null;
  }

  // Debounced watch effect for pagination changes
  const debouncedFetch = useDebounceFn(() => {
    fetchPieces();
  }, 300);

  watch([pageIndex, pageSize], () => {
    debouncedFetch();
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
