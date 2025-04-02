import { watch } from "vue";
import type { Piece } from "~/types/Types";
import { useFetch, useRuntimeConfig } from "#app";
import { ref } from "vue";
import { useDebounceFn } from "@vueuse/core";

// Import dummy data directly
const dummyMusicData: Piece[] = [
  {
    stid: 1,
    name: "Test",
    genre: "klassik",
    jahr: null,
    schwierigkeit: "easy",
    isdigitalisiert: null,
    arrangiert: [],
    komponiert: []
  },
  {
    stid: 2,
    name: "A Michael Jackson Tribute",
    genre: "Pop / Rock / Modern",
    jahr: null,
    schwierigkeit: "hard",
    isdigitalisiert: true,
    arrangiert: [{ pid: 2, vorname: "Michael", name: "Story" }],
    komponiert: [{ pid: 1, vorname: "Michael", name: "Jackson" }]
  }
];

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
      console.log('API URL:', apiUrl); // Debug log

      if (!apiUrl) {
        console.info("No API URL configured, using dummy data");
        pieces.value = dummyMusicData;
        totalItems.value = dummyMusicData.length;
        lastPage.value = Math.ceil(dummyMusicData.length / pageSize.value);
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

      console.log('Fetching from API...'); // Debug log
      const { data, error: fetchError } = await useFetch<PaginatedResponse<Piece>>(
        `${apiUrl}/stuecke`,
        {
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
        }
      );

      console.log('API Response:', data.value); // Debug log

      if (fetchError.value) {
        throw fetchError.value;
      }

      if (data.value && Array.isArray(data.value.data) && data.value.data.length > 0) {
        pieces.value = data.value.data;
        totalItems.value = data.value.meta.total;
        lastPage.value = data.value.meta.lastPage;

        // Cache the response
        fetchCache.value[cacheKey] = {
          data: data.value,
          timestamp: Date.now()
        };

        // Cache the pieces by their ID
        data.value.data.forEach((piece: Piece) => {
          if (piece.stid) {
            pieceCache.value[piece.stid.toString()] = piece;
          }
        });
      } else {
        console.info("No data from API, using dummy data"); // Debug log
        pieces.value = dummyMusicData;
        totalItems.value = dummyMusicData.length;
        lastPage.value = Math.ceil(dummyMusicData.length / pageSize.value);
        isUsingDummyData.value = true;
      }
    } catch (err) {
      console.error("Error fetching pieces:", err);
      error.value = err as Error;
      pieces.value = dummyMusicData;
      totalItems.value = dummyMusicData.length;
      lastPage.value = Math.ceil(dummyMusicData.length / pageSize.value);
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
