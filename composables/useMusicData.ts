import { ref, watch } from "vue";
import type { Piece } from "~/types/Types";
import { useFetch, useState, useRuntimeConfig } from "#app";
import dummyMusicData from "~/content/dummyMusicData";

export function useMusicData(initialPageIndex = 0, initialPageSize = 10) {
  const config = useRuntimeConfig();
  const pageIndex = useState("pageIndex", () => initialPageIndex);
  const pageSize = useState("pageSize", () => initialPageSize);
  const pieces = useState<Piece[]>("pieces", () => []);
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

      const { data, error: fetchError } = await useFetch<Piece[]>(`${apiUrl}/stuecke`, {
        immediate: false,
        lazy: true,
        default: () => [],
      });

      if (fetchError.value) {
        throw fetchError.value;
      }

      if (Array.isArray(data.value) && data.value.length > 0) {
        pieces.value = data.value;
        // Cache the pieces by their ID
        data.value.forEach((piece: Piece) => {
          if (piece.stid) {
            pieceCache.value[piece.stid] = piece;
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
      const dummyPiece = dummyMusicData.find((p: Piece) => p.stid.toString() === id);
      if (dummyPiece) {
        pieceCache.value[id] = dummyPiece;
        return dummyPiece;
      }
      return null;
    }

    try {
      const { data, error: fetchError } = await useFetch<Piece>(`${config.public.API_URL}/stuecke/${id}`, {
        immediate: false,
        lazy: true
      });

      if (fetchError.value) {
        throw fetchError.value;
      }

      if (data.value) {
        pieceCache.value[id] = data.value;
        return data.value;
      }
    } catch (err) {
      console.error(`Error fetching piece with ID ${id}:`, err);
      // Fallback to dummy data in case of error
      const dummyPiece = dummyMusicData.find((p: Piece) => p.stid.toString() === id);
      if (dummyPiece) {
        pieceCache.value[id] = dummyPiece;
        return dummyPiece;
      }
    }

    return null;
  }

  // Only fetch when pagination changes if we already have data
  watch([pageIndex, pageSize], () => {
    if (pieces.value.length > 0) {
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
    isUsingDummyData
  };
}