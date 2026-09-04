import { vi } from "vitest";

const cacheStore = new Map<string, string>();

vi.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  Cache: class {
    get(key: string) {
      return cacheStore.get(key);
    }
    set(key: string, data: string) {
      cacheStore.set(key, data);
    }
    remove(key: string) {
      return cacheStore.delete(key);
    }
    clear() {
      cacheStore.clear();
    }
    has(key: string) {
      return cacheStore.has(key);
    }
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
    Star: "star-16",
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
    Image: "image-16",
    ArrowClockwise: "arrow-clockwise-16",
    Swatch: "swatch-16",
    Link: "link-16",
    House: "house-16",
    AppWindow: "app-window-16",
    Key: "key-16",
    WrenchScrewdriver: "wrench-screwdriver-16",
    Cog: "cog-16",
    Person: "person-16",
    TwoPeople: "two-people-16",
    Building: "building-16",
    Document: "blank-document-16",
    BlankDocument: "blank-document-16",
    List: "list-16",
    BulletPoints: "bullet-points-16",
    CheckList: "check-list-16",
    Calendar: "calendar-16",
    Envelope: "envelope-16",
    Phone: "phone-16",
    Bubble: "speech-bubble-16",
    Heart: "heart-16",
    Bookmark: "bookmark-16",
    Tag: "tag-16",
    Hashtag: "hashtag-16",
    AtSymbol: "at-symbol-16",
    BarChart: "bar-chart-16",
    LineChart: "line-chart-16",
    Bolt: "bolt-16",
    Bug: "bug-16",
    Code: "code-16",
    Eye: "eye-16",
    Finder: "finder-16",
    Layers: "layers-16",
    MagnifyingGlass: "magnifying-glass-16",
    Pencil: "pencil-16",
    Plus: "plus-16",
    Receipt: "receipt-16",
    Shield: "shield-16",
    Store: "store-16",
    Trophy: "trophy-16",
    Wallet: "wallet-16",
  },
  Toast: { Style: { Animated: "animated", Failure: "failure", Success: "success" } },
  closeMainWindow: vi.fn(() => Promise.resolve()),
}));
