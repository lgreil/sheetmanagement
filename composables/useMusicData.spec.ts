// useMusicData.spec.ts
import { ref, nextTick } from "vue";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMusicData } from "./useMusicData";
import dummyMusicData from "~/content/dummyMusicData";
import type { Piece } from "../types/music";

// Mock the useFetch function from Nuxt
vi.mock("#app", () => ({
  useFetch: vi.fn(),
}));

// Import the mocked useFetch for configuration
import { useFetch } from "#app";

describe("useMusicData", () => {
  const fakePieces: Piece[] = [
    {
      stid: 1,
      name: "Piece One",
      genre: "rock",
      jahr: 2020,
      schwierigkeit: "medium",
      isdigitalisiert: true,
      composer_names: ["Composer One"],
      arranger_names: ["Arranger One"],
    },
  ];

  beforeEach(() => {
    // Reset the mock before each test
    vi.resetAllMocks();
  });

  it("fetches pieces and validates their structure", async () => {
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref(fakePieces),
    });

    const { pieces, fetchPieces } = useMusicData();
    await fetchPieces();
    await nextTick();

    expect(pieces.value).toEqual(fakePieces);
  });

  it("handles empty API responses gracefully", async () => {
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref([]),
    });

    const { pieces, fetchPieces } = useMusicData();
    await fetchPieces();
    await nextTick();

    expect(pieces.value).toEqual([]);
  });

  it("handles malformed API responses", async () => {
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref([{ invalidKey: "invalidValue" }]),
    });

    const { pieces, fetchPieces, error } = useMusicData();
    await fetchPieces();
    await nextTick();

    expect(pieces.value).toEqual([]);
    expect(error.value).toBeInstanceOf(Error);
    expect(error.value?.message).toBe("Invalid API response");
  });

  it("handles errors when fetching fails", async () => {
    const fakeError = new Error("Failed to fetch");
    (useFetch as ReturnType<typeof vi.fn>).mockRejectedValue(fakeError);

    const { error, fetchPieces, loading } = useMusicData();
    await fetchPieces();
    await nextTick();

    expect(error.value).toEqual(fakeError);
    expect(loading.value).toBe(false);
  });

  it("falls back to dummy data when API returns no data", async () => {
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref([]),
    });

    const { pieces, fetchPieces } = useMusicData();
    await fetchPieces();
    await nextTick();

    expect(pieces.value).toEqual(dummyMusicData);
  });

  it("falls back to dummy data when API call fails", async () => {
    const fakeError = new Error("API failure");
    (useFetch as ReturnType<typeof vi.fn>).mockRejectedValue(fakeError);

    const { pieces, fetchPieces, error } = useMusicData();
    await fetchPieces();
    await nextTick();

    expect(pieces.value).toEqual(dummyMusicData);
    expect(error.value).toEqual(fakeError);
  });

  it("uses API data when valid data is returned", async () => {
    const fakePieces: Piece[] = [
      {
        stid: 1,
        name: "Piece One",
        genre: "rock",
        jahr: 2020,
        schwierigkeit: "medium",
        isdigitalisiert: true,
        composer_names: ["Composer One"],
        arranger_names: ["Arranger One"],
      },
    ];

    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref(fakePieces),
    });

    const { pieces, fetchPieces } = useMusicData();
    await fetchPieces();
    await nextTick();

    expect(pieces.value).toEqual(fakePieces);
  });
});

describe("useMusicData - Additional Tests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("updates loading state correctly during fetch", async () => {
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref([]),
    });

    const { loading, fetchPieces } = useMusicData();

    const fetchPromise = fetchPieces();
    expect(loading.value).toBe(true);

    await fetchPromise;
    await nextTick();

    expect(loading.value).toBe(false);
  });

  it("handles pagination state changes", async () => {
    const { pageIndex, pageSize, fetchPieces } = useMusicData();

    expect(pageIndex.value).toBe(0);
    expect(pageSize.value).toBe(10);

    pageIndex.value = 1;
    pageSize.value = 20;

    await fetchPieces();
    await nextTick();

    expect(pageIndex.value).toBe(1);
    expect(pageSize.value).toBe(20);
  });

  it("fetchPieces can be called multiple times without issues", async () => {
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref([]),
    });

    const { fetchPieces } = useMusicData();

    await fetchPieces();
    await fetchPieces();

    expect(useFetch).toHaveBeenCalledTimes(2);
  });
});
