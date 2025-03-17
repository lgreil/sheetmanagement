// useMusicData.spec.ts
import { ref, nextTick } from "vue";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useMusicData } from "./useMusicData";

// Mock the useFetch function from Nuxt
vi.mock("#app", () => ({
  useFetch: vi.fn(),
}));

// Import the mocked useFetch for configuration
import { useFetch } from "#app";

const fakePieces = [
  { id: 1, name: "Piece One", genre: "rock" },
  { id: 2, name: "Piece Two", genre: "pop" },
];

describe("useMusicData", () => {
  beforeEach(() => {
    // Reset the mock before each test
    vi.resetAllMocks();
  });

  it("fetches pieces and updates state correctly", async () => {
    // Arrange: simulate a successful fetch response
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref(fakePieces),
    });

    // Act: call the composable and trigger fetchPieces manually
    const { pieces, loading, error, fetchPieces } = useMusicData();
    await fetchPieces();
    await nextTick(); // wait for reactivity

    // Assert: pieces should equal our fake data; loading is false and error is null
    expect(pieces.value).toEqual(fakePieces);
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("receives content with the correct shape", async () => {
    // Arrange: simulate a successful fetch response
    (useFetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: ref(fakePieces),
    });

    // Act: call the composable and trigger fetchPieces
    const { pieces, fetchPieces } = useMusicData();
    await fetchPieces();
    await nextTick();

    // Assert: verify that pieces is an array and each item has the expected properties
    expect(Array.isArray(pieces.value)).toBe(true);
    if (pieces.value.length > 0) {
      const piece = pieces.value[0];
      expect(piece).toHaveProperty("id");
      expect(piece).toHaveProperty("name");
      expect(piece).toHaveProperty("genre");
    }
  });

  it("handles errors when fetching fails", async () => {
    // Arrange: simulate an API error
    const fakeError = new Error("Failed to fetch")(
      useFetch as ReturnType<typeof vi.fn>,
    ).mockRejectedValue(fakeError);

    // Act: call the composable and trigger fetchPieces
    const { error, fetchPieces, loading } = useMusicData();
    await fetchPieces();
    await nextTick();

    // Assert: the error should be set and loading should be false
    expect(error.value).toEqual(fakeError);
    expect(loading.value).toBe(false);
  });
});
