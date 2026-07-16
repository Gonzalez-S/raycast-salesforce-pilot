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
  Toast: { Style: { Failure: "failure", Success: "success" } },
}));
