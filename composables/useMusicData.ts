import { ref, onMounted, watch } from "vue";
import type { Piece } from "~/types/music";
import { useFetch, useState } from "#app";
import dummyMusicData from "~/content/dummyMusicData";

export function useMusicData(initialPageIndex = 0, initialPageSize = 10) {
  const pageIndex = useState("pageIndex", () => initialPageIndex);
  const pageSize = useState("pageSize", () => initialPageSize);
  const pieces = useState<Piece[]>("pieces", () => []);
  const pieceCache = useState<Record<string, Piece>>("pieceCache", () => ({}));
  const loading = useState("loading", () => true);
  const error = useState<Error | null>("error", () => null);

  async function fetchPieces() {
    loading.value = true;
    error.value = null;

    try {
      const { data, pending, error: fetchError } = await useFetch<Piece[]>(
        `${useRuntimeConfig().public.API_URL}/stuecke`
      );

      await pending;

      if (fetchError.value) {
        throw fetchError.value;
      }

      if (Array.isArray(data.value) && data.value.length > 0) {
        pieces.value = data.value;
        // Cache the pieces by their ID
        data.value.forEach(piece => {
          if (piece.id) {
            pieceCache.value[piece.id] = piece;
          }
        });
        useToast().success("Data successfully fetched!");
      } else {
        console.warn("API returned no data or invalid data. Falling back to dummy data.");
        pieces.value = dummyMusicData;
        useToast().warning("No valid data from API. Using dummy data.");
      }
    } catch (err) {
      console.error("Error fetching pieces. Falling back to dummy data:", err);
      pieces.value = dummyMusicData;
      useToast().error("Error fetching data. Using dummy data.");
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  }

  async function fetchPieceById(id: string): Promise<Piece | null> {
    if (pieceCache.value[id]) {
      return pieceCache.value[id];
    }

    try {
      const { data, pending, error: fetchError } = await useFetch<Piece>(
        `${useRuntimeConfig().public.API_URL}/stuecke/${id}`
      );

      await pending;

      if (fetchError.value) {
        throw fetchError.value;
      }

      if (data.value) {
        pieceCache.value[id] = data.value; // Cache the fetched piece
        return data.value;
      }
    } catch (err) {
      console.error(`Error fetching piece with ID ${id}:`, err);
      useToast().error(`Error fetching piece with ID ${id}.`);
    }

    return null;
  }

  onMounted(() => {
    fetchPieces();
  });

  watch([pageIndex, pageSize], () => {
    fetchPieces();
  });

  return { pieces, loading, error, fetchPieces, fetchPieceById, pageIndex, pageSize };
}
