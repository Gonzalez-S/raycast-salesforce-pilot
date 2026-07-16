export const HOME_PATH = "/lightning/page/home";
export const SETUP_PATH = "/lightning/setup/SetupOneHome/home";
export const DEFAULT_SECTION = "Other";
export const ORG_SETTINGS_KEY = "salesforce-pilot-org-prefs"; // LocalStorage key for per-org display settings (label, color, section).
export const SF_MAX_BUFFER = 10 * 1024 * 1024; // Node child_process maxBuffer when capturing `sf --json` stdout.
export const EXPIRATION_WARN_DAYS = 7;
export const MS_PER_DAY = 86_400_000;

export const COLORS = [
  { name: "Angular Red", value: "#dd0531" },
  { name: "Azure Blue", value: "#007fff" },
  { name: "JavaScript Yellow", value: "#f9e64f" },
  { name: "Mandalorian Blue", value: "#1857a4" },
  { name: "Node Green", value: "#215732" },
  { name: "React Blue", value: "#61dafb" },
  { name: "Something Different", value: "#832561" },
  { name: "Svelte Orange", value: "#ff3d00" },
  { name: "Vue Green", value: "#42b883" },
] as const;

export const DEFAULT_COLOR = COLORS[1].value; // Azure Blue

export const LOGIN_URLS = {
  production: "https://login.salesforce.com",
  sandbox: "https://test.salesforce.com",
} as const;
