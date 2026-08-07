import { vi } from "vitest";

vi.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  getPreferenceValues: vi.fn(() => ({})),
  openExtensionPreferences: vi.fn(() => Promise.resolve()),
  showToast: vi.fn(),
  showHUD: vi.fn(),
  open: vi.fn(),
  Color: {
    Red: "red",
    Yellow: "yellow",
    Blue: "blue",
    Green: "green",
    Purple: "purple",
    SecondaryText: "secondary",
  },
  Icon: {
    Star: "star",
    Pin: "pin-16",
    Globe: "globe-16",
    Box: "box-16",
    Hammer: "hammer-16",
    Terminal: "terminal-16",
    QuestionMark: "question-mark-circle-16",
    Folder: "folder-16",
    Warning: "warning-16",
    Clock: "clock-16",
    CheckCircle: "check-circle-16",
  },
  Toast: { Style: { Animated: "animated", Failure: "failure", Success: "success" } },
  closeMainWindow: vi.fn(() => Promise.resolve()),
}));
