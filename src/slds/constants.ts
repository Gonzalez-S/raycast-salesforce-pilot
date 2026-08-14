/** Pinned SLDS release — bump to refresh CDN asset paths. */
export const SLDS_VERSION = "2.264.0";

export const SLDS_CDN_ROOT = `https://cdn.jsdelivr.net/npm/@salesforce-ux/design-system@${SLDS_VERSION}`;

export const SLDS_ICONS_CATALOG_URL = `${SLDS_CDN_ROOT}/ui.icons.json`;
export const SLDS_BG_CUSTOM_URL = `${SLDS_CDN_ROOT}/design-tokens/dist/bg-custom.json`;
export const SLDS_BG_STANDARD_URL = `${SLDS_CDN_ROOT}/design-tokens/dist/bg-standard.json`;
export const SLDS_BG_ACTIONS_URL = `${SLDS_CDN_ROOT}/design-tokens/dist/bg-actions.json`;

export const SLDS_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SLDS_CACHE_NAMESPACE = "slds";
export const SLDS_CACHE_CAPACITY = 12 * 1024 * 1024;

export const CACHE_KEY = {
  iconColors: `icon-colors:${SLDS_VERSION}`,
  iconsCatalog: `icons-catalog:${SLDS_VERSION}`,
} as const;

/** Default utility glyph color used by SLDS PNG exports. */
export const UTILITY_ICON_FILL = "#54698d";
