import { CACHE_KEY, SLDS_BG_ACTIONS_URL, SLDS_BG_CUSTOM_URL, SLDS_BG_STANDARD_URL } from "./constants";
import { getOrFetch } from "./cache";

/** Map of `category:name` → background hex from SLDS design tokens. */
export type IconColorMap = Record<string, string>;

type TokenMap = Record<string, string>;

export const rgbOrHexToHex = (value: string): string => {
  const rgb = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) {
    return `#${[rgb[1], rgb[2], rgb[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  }
  return value.toLowerCase();
};

/** Convert `bg-*.json` token keys into `category:icon_name` map entries. */
export const parseBackgroundTokens = (input: {
  custom: TokenMap;
  standard: TokenMap;
  actions: TokenMap;
}): IconColorMap => {
  const map: IconColorMap = {};

  for (const [key, value] of Object.entries(input.custom)) {
    const match = key.match(/^CUSTOM_(\d+)$/);
    if (!match) continue;
    map[`custom:custom${match[1]}`] = rgbOrHexToHex(value);
  }

  for (const [key, value] of Object.entries(input.standard)) {
    map[`standard:${key.toLowerCase()}`] = rgbOrHexToHex(value);
  }

  for (const [key, value] of Object.entries(input.actions)) {
    if (!key.startsWith("ACTION_")) continue;
    map[`action:${key.slice("ACTION_".length).toLowerCase()}`] = rgbOrHexToHex(value);
  }

  return map;
};

const fetchJson = async (url: string, label: string): Promise<TokenMap> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Couldn’t download SLDS ${label} (${response.status})`);
  }
  const payload = (await response.json()) as unknown;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error(`Unexpected SLDS ${label} shape`);
  }
  return payload as TokenMap;
};

const fetchIconColorMap = async (): Promise<IconColorMap> => {
  const [custom, standard, actions] = await Promise.all([
    fetchJson(SLDS_BG_CUSTOM_URL, "bg-custom"),
    fetchJson(SLDS_BG_STANDARD_URL, "bg-standard"),
    fetchJson(SLDS_BG_ACTIONS_URL, "bg-actions"),
  ]);
  return parseBackgroundTokens({ custom, standard, actions });
};

/** Weekly-cached icon background colors from SLDS `bg-*.json` tokens. */
export const loadIconColorMap = (options?: { force?: boolean }) =>
  getOrFetch(CACHE_KEY.iconColors, fetchIconColorMap, options);
