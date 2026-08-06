export const HOME_PATH = "/lightning/page/home";
export const SETUP_PATH = "/lightning/setup/SetupOneHome/home";

/** Manual group for orgs that aren't categorized yet. */
export const DEFAULT_GROUP = "Other";
/** Dropdown: flat list sorted by CLI lastUsed (newest first). */
export const RECENT_SCOPE = "recents";
/** Dropdown: every non-favorite org, grouped manually. */
export const ALL_SCOPE = "all";
/** Always-visible list section for starred orgs (independent of group scope). */
export const FAVORITES_SECTION = "Favorites";

export const ORG_SETTINGS_KEY = "salesforce-pilot-org-prefs";
export const SCOPE_CACHE_KEY = "salesforce-pilot-org-scope";
export const SF_MAX_BUFFER = 10 * 1024 * 1024;
export const EXPIRATION_WARN_DAYS = 7;
export const MS_PER_DAY = 86_400_000;

/** Warm reds for production / Dev Hub orgs — easy to spot before you click. */
export const PRODUCTION_COLORS = [
  { name: "Ember", value: "#C62828" },
  { name: "Crimson", value: "#E53935" },
  { name: "Torch", value: "#FF1744" },
  { name: "Brick", value: "#B71C1C" },
  { name: "Garnet", value: "#AD1457" },
  { name: "Merlot", value: "#880E4F" },
] as const;

/** Soft pastels for sandboxes, scratches, and misc orgs. */
export const SANDBOX_COLORS = [
  { name: "Mist", value: "#90CAF9" },
  { name: "Seafoam", value: "#80CBC4" },
  { name: "Sage", value: "#A5D6A7" },
  { name: "Butter", value: "#FFE082" },
  { name: "Peach", value: "#FFCC80" },
  { name: "Lilac", value: "#CE93D8" },
  { name: "Sky", value: "#81D4FA" },
  { name: "Fog", value: "#B0BEC5" },
  { name: "Mint", value: "#B2DFDB" },
  { name: "Coral", value: "#FFAB91" },
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
