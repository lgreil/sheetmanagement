import { ref, onMounted, watch } from "vue";
import type { Piece } from "~/types/music";
import { useFetch } from "#app";

export function useMusicData(initialPageIndex = 0, initialPageSize = 10) {
  const pageIndex = ref(initialPageIndex);
  const pageSize = ref(initialPageSize);
  const pieces = ref<Piece[]>([]);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  async function fetchPieces() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await useFetch<{ items: Piece[] }>(
        `${useRuntimeConfig().public.API_URL}/stuecke`
      );
      if (data.value && data.value.items) {
        pieces.value = data.value.items;
      } else {
        throw new Error("Invalid API response");
      }
    } catch (err) {
      error.value = err as Error;
      console.error("Error fetching pieces:", error.value);
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    fetchPieces();
  });

  watch([pageIndex, pageSize], () => {
    fetchPieces();
  });

  return { pieces, loading, error, fetchPieces, pageIndex, pageSize };
}
