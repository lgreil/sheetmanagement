import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  let originalWindow: Window & typeof globalThis;

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    originalWindow = global.window;
    global.window = {
      ...originalWindow,
      matchMedia: vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        addListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    } as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("initializes with default theme based on system preference", () => {
    const { isDarkMode } = useTheme();
    expect(isDarkMode.value).toBe(true); // Assuming system preference is dark
  });

  it("toggles theme and persists in localStorage", () => {
    const { isDarkMode, toggleTheme } = useTheme();

    expect(isDarkMode.value).toBe(false); // Default to light mode

    toggleTheme();
    expect(isDarkMode.value).toBe(true);
    expect(localStorage.getItem("isDarkMode")).toBe("true");

    toggleTheme();
    expect(isDarkMode.value).toBe(false);
    expect(localStorage.getItem("isDarkMode")).toBe("false");
  });

  it("respects user preference from localStorage", () => {
    localStorage.setItem("isDarkMode", "true");
    const { isDarkMode } = useTheme();
    expect(isDarkMode.value).toBe(true);

    localStorage.setItem("isDarkMode", "false");
    const { isDarkMode: isDarkMode2 } = useTheme();
    expect(isDarkMode2.value).toBe(false);
  });
});