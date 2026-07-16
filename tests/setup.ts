import { vi } from "vitest";

vi.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  showToast: vi.fn(),
  showHUD: vi.fn(),
  open: vi.fn(),
  Color: { Red: "red", Yellow: "yellow" },
  Toast: { Style: { Animated: "animated", Failure: "failure", Success: "success" } },
}));
