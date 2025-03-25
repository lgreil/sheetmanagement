import { describe, it, expect } from "vitest";
import { useMenu } from "./useMenu";

describe("useMenu", () => {
  it("initializes with menu closed", () => {
    const { menuOpen } = useMenu();
    expect(menuOpen.value).toBe(false);
  });

  it("toggles menu state", () => {
    const { menuOpen, toggleMenu } = useMenu();

    toggleMenu();
    expect(menuOpen.value).toBe(true);

    toggleMenu();
    expect(menuOpen.value).toBe(false);
  });

  it("closes menu explicitly", () => {
    const { menuOpen, toggleMenu, closeMenu } = useMenu();

    toggleMenu();
    expect(menuOpen.value).toBe(true);

    closeMenu();
    expect(menuOpen.value).toBe(false);
  });
});