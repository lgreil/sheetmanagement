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
    komponiert: [],
  },
  {
    stid: 2,
    name: "A Michael Jackson Tribute",
    genre: "Pop / Rock / Modern",
    jahr: null,
    schwierigkeit: "hard",
    isdigitalisiert: true,
    arrangiert: [{ pid: 2, vorname: "Michael", name: "Story" }],
    komponiert: [{ pid: 1, vorname: "Michael", name: "Jackson" }],
  },
  {
    stid: 5,
    name: "Egmont Overtüre",
    genre: "Klassik",
    jahr: null,
    schwierigkeit: null,
    isdigitalisiert: true,
    arrangiert: [{ pid: 6, vorname: "Richard", name: "Meyer" }],
    komponiert: [{ pid: 5, vorname: "Ludwig van", name: "Beethoven" }],
  },
  {
    stid: 8,
    name: "Ode to Joy",
    genre: "Moderne Klassik",
    jahr: null,
    schwierigkeit: null,
    isdigitalisiert: true,
    arrangiert: [{ pid: 11, vorname: "Keith", name: "Christopher" }],
    komponiert: [{ pid: 5, vorname: "Ludwig van", name: "Beethoven" }],
  },
  {
    stid: 14,
    name: "Highlights from WICKED",
    genre: "Musicals",
    jahr: null,
    schwierigkeit: null,
    isdigitalisiert: true,
    arrangiert: [{ pid: 20, vorname: "Ted", name: "Ricketts" }],
    komponiert: [{ pid: 19, vorname: "Stephen", name: "Schwartz" }],
  },
  {
    stid: 21,
    name: "Lord of the Rings",
    genre: "Filmmusik",
    jahr: null,
    schwierigkeit: null,
    isdigitalisiert: true,
    arrangiert: [{ pid: 29, vorname: "John", name: "Whitney" }],
    komponiert: [{ pid: 28, vorname: "Howard", name: "Shore" }],
  },
  {
    stid: 32,
    name: "Die vier Jahreszeiten: der Frühling",
    genre: "Barock",
    jahr: null,
    schwierigkeit: "medium",
    isdigitalisiert: true,
    arrangiert: [],
    komponiert: [{ pid: 42, vorname: "Antonio", name: "Vivaldi" }],
  },
  {
    stid: 43,
    name: "Lion King",
    genre: "Filmmusik",
    jahr: null,
    schwierigkeit: "test",
    isdigitalisiert: true,
    arrangiert: [{ pid: 51, vorname: "Ted", name: "Parson" }],
    komponiert: [{ pid: 50, vorname: "Hans", name: "Zimmer" }],
  },
  {
    stid: 62,
    name: "Seven Nation Army",
    genre: "Pop / Rock / Modern",
    jahr: null,
    schwierigkeit: "very hard",
    isdigitalisiert: true,
    arrangiert: [{ pid: 67, vorname: "Paul", name: "Murtha" }],
    komponiert: [{ pid: 66, vorname: "the", name: "White Stripes" }],
  },
  {
    stid: 89,
    name: "Jesu bleibet meine Freude - Choral",
    genre: "Barock",
    jahr: null,
    schwierigkeit: "very easy",
    isdigitalisiert: true,
    arrangiert: [{ pid: 90, vorname: "Barbara", name: "Fritsch" }],
    komponiert: [{ pid: 15, vorname: "J. S.", name: "Bach" }],
  },
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
      console.log("API URL:", apiUrl); // Debug log

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
