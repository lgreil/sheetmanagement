import { ref, onMounted, watch } from "vue";
import type { Piece } from "~/types/music";
import { useFetch } from "#app";

export function useMusicData(initialPageIndex = 0, initialPageSize = 10) {
  const { pageIndex } = useState("pageIndex", () => initialPageIndex);
  const { pageSize } = useState("pageSize", () => initialPageSize);
  const { pieces } = useState<Piece[]>("pieces", () => []);
  const { loading } = useState("loading", () => true);
  const { error } = useState<Error | null>("error", () => null);

  async function fetchPieces() {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await useFetch<Piece[]>(
        {
          key: `pieces-${pageIndex.value}-${pageSize.value}`,
          default: () => [],
        },
        `${process.env.API_URL}/stuecke`,
      );
      console.log(data.value);
      pieces.value = data.value || [];
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
