import { CACHE_KEY, SLDS2_COSMOS_THEME_URL } from "./constants";
import { getOrFetch } from "./cache";

export type ColorGroup = "semantic" | "palette" | "scale";

export type SalesforceColor = {
  /** CSS custom property without leading `--`, e.g. `slds-g-color-surface-1` */
  name: string;
  cssVar: string;
  group: ColorGroup;
  /** Palette family (`blue`) or scale family (`brand`) or semantic bucket (`surface`). */
  family: string;
  light: string;
  dark: string;
  /** True when Cosmos defines distinct light/dark via `light-dark()`. */
  dual: boolean;
  swatchUrl: string;
};

const NAMED: Record<string, string> = {
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
};

export const normalizeColor = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  if (NAMED[trimmed]) return NAMED[trimmed];
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${[...trimmed.slice(1)].map((c) => c + c).join("")}`;
  }
  return trimmed;
};

export const parseLightDark = (raw: string): { light: string; dark: string; dual: boolean } | undefined => {
  const dual = raw.match(/^light-dark\(\s*([^,]+)\s*,\s*([^)]+?)\s*\)$/i);
  if (dual) {
    return { light: normalizeColor(dual[1]), dark: normalizeColor(dual[2]), dual: true };
  }
  if (/^#|^rgb|^hsl|^[a-z]+$/i.test(raw.trim())) {
    const color = normalizeColor(raw);
    return { light: color, dark: color, dual: false };
  }
  return undefined;
};

const familyFromName = (name: string): { group: ColorGroup; family: string } => {
  const palette = name.match(/^slds-g-color-palette-([a-z0-9-]+)-\d+$/);
  if (palette) return { group: "palette", family: palette[1] };

  const scale = name.match(/^slds-r-color-([a-z0-9-]+)-\d+$/);
  if (scale) return { group: "scale", family: scale[1] };

  const semantic = name.match(/^slds-g-color-([a-z0-9]+)/);
  return { group: "semantic", family: semantic?.[1] ?? "other" };
};

export const swatchDataUri = (light: string, dark: string, dual: boolean): string => {
  const svg = dual
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="50%" stop-color="${light}"/><stop offset="50%" stop-color="${dark}"/></linearGradient></defs><rect width="64" height="64" rx="10" fill="url(#g)"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="${light}"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/** Short label for grid UI: `--slds-g-color-brand-base-100` → `brand-base-100`. */
export const colorDisplayName = (cssVar: string): string => cssVar.replace(/^--slds-[gr]-color-/, "");

const resolveVarRef = (raw: string, vars: Map<string, string>, depth = 0): string | undefined => {
  const match = raw.match(/^var\(\s*--([a-z0-9-]+)\s*\)$/i);
  if (!match || depth > 5) return undefined;
  const next = vars.get(match[1]);
  if (!next) return undefined;
  const parsed = parseLightDark(next);
  if (parsed) return next;
  return resolveVarRef(next, vars, depth + 1);
};

/** Parse Cosmos theme CSS into concrete color tokens (resolves simple `var(--…)` aliases). */
export const parseCosmosThemeCss = (css: string): SalesforceColor[] => {
  const vars = new Map<string, string>();
  for (const match of css.matchAll(/--(slds-[gr]-color-[a-z0-9-]+):\s*([^;]+);/gi)) {
    vars.set(match[1], match[2].trim());
  }

  const colors: SalesforceColor[] = [];
  for (const [name, rawValue] of vars) {
    const resolved = parseLightDark(rawValue) ? rawValue : resolveVarRef(rawValue, vars);
    if (!resolved) continue;
    const parsed = parseLightDark(resolved);
    if (!parsed) continue;

    const { group, family } = familyFromName(name);
    colors.push({
      name,
      cssVar: `--${name}`,
      group,
      family,
      light: parsed.light,
      dark: parsed.dark,
      dual: parsed.dual,
      swatchUrl: swatchDataUri(parsed.light, parsed.dark, parsed.dual),
    });
  }

  colors.sort((a, b) => a.cssVar.localeCompare(b.cssVar));
  return colors;
};

const fetchCosmosColors = async (): Promise<SalesforceColor[]> => {
  const response = await fetch(SLDS2_COSMOS_THEME_URL);
  if (!response.ok) {
    throw new Error(`Couldn’t download Cosmos theme CSS (${response.status})`);
  }
  return parseCosmosThemeCss(await response.text());
};

export const loadCosmosColors = (options?: { force?: boolean }) =>
  getOrFetch(CACHE_KEY.cosmosColors, fetchCosmosColors, options);

export const filterColors = (
  colors: SalesforceColor[],
  group: ColorGroup | "all",
  family?: string,
): SalesforceColor[] => {
  let next = group === "all" ? colors : colors.filter((color) => color.group === group);
  if (family && family !== "all") {
    next = next.filter((color) => color.family === family);
  }
  return next;
};

export const colorFamilies = (colors: SalesforceColor[], group: ColorGroup | "all"): string[] => {
  const scoped = group === "all" ? colors : colors.filter((color) => color.group === group);
  return [...new Set(scoped.map((color) => color.family))].sort((a, b) => a.localeCompare(b));
};
