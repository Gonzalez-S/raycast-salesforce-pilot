/** Manual group for orgs that aren't categorized yet. */
export const DEFAULT_GROUP = "Other";
/** Dropdown: flat list sorted by CLI lastUsed (newest first). */
export const RECENT_SCOPE = "recents";
/** Dropdown: every non-pinned org, grouped manually. */
export const ALL_SCOPE = "all";
/** Always-visible list section for pinned orgs (independent of group scope). */
export const PINS_SECTION = "Pins";

export const ORG_SETTINGS_KEY = "salesforce-pilot-org-prefs";
export const SCOPE_CACHE_KEY = "salesforce-pilot-org-scope";
/** LocalStorage: browser id → last Open In… timestamp. */
export const OPEN_IN_RECENTS_KEY = "salesforce-pilot-open-in-recents";
/** LocalStorage: username → open-link path → last used timestamp. */
export const OPEN_LINK_RECENTS_KEY = "salesforce-pilot-open-link-recents";

export const SF_MAX_BUFFER = 10 * 1024 * 1024;
export const EXPIRATION_WARN_DAYS = 7;
export const MS_PER_DAY = 86_400_000;

/** High-contrast accents for production / Dev Hub orgs — Torch plus non-red hues. */
export const PRODUCTION_COLORS = [
  { name: "Torch", value: "#FF1744" },
  { name: "Amber", value: "#FFAB00" },
  { name: "Orange", value: "#FF6D00" },
  { name: "Magenta", value: "#D500F9" },
  { name: "Violet", value: "#651FFF" },
  { name: "Azure", value: "#2979FF" },
] as const;

/** Soft accents for sandboxes, scratches, and misc — spaced around the hue wheel. */
export const SANDBOX_COLORS = [
  { name: "Mist", value: "#64B5F6" },
  { name: "Cyan", value: "#26C6DA" },
  { name: "Indigo", value: "#9FA8DA" },
  { name: "Mint", value: "#66BB6A" },
  { name: "Butter", value: "#FFD54F" },
  { name: "Peach", value: "#FF8A65" },
  { name: "Blush", value: "#F06292" },
  { name: "Lilac", value: "#BA68C8" },
  { name: "Fog", value: "#90A4AE" },
] as const;

export const COLORS = [...PRODUCTION_COLORS, ...SANDBOX_COLORS] as const;

export const DEFAULT_PRODUCTION_COLOR = PRODUCTION_COLORS[0].value;
export const DEFAULT_SANDBOX_COLOR = SANDBOX_COLORS[0].value;

export const LOGIN_URLS = {
  production: "https://login.salesforce.com",
  sandbox: "https://test.salesforce.com",
} as const;

export const ORG_KINDS = ["devhub", "production", "sandbox", "scratch", "other"] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export const ORG_KIND_LABEL: Record<OrgKind, string> = {
  devhub: "Dev Hub",
  production: "Production",
  sandbox: "Sandbox",
  scratch: "Scratch",
  other: "Other",
};

/** Sort priority within a group (lower = higher in the list). */
export const ORG_KIND_ORDER: Record<OrgKind, number> = {
  devhub: 0,
  production: 1,
  sandbox: 2,
  scratch: 3,
  other: 4,
};
