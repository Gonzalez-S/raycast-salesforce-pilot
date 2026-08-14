import { SLDS_CDN_ROOT, SLDS_ICONS_CATALOG_URL } from "../slds/constants";

export const ICONS_CATALOG_URL = SLDS_ICONS_CATALOG_URL;
export const SLDS_ICONS_PAGE = "https://www.lightningdesignsystem.com/icons/";

export const ICON_CATEGORIES = ["action", "custom", "doctype", "standard", "utility"] as const;
export type IconCategory = (typeof ICON_CATEGORIES)[number];

export const ALL_CATEGORY = "all";
export type IconCategoryFilter = IconCategory | typeof ALL_CATEGORY;

export const CATEGORY_LABEL: Record<IconCategoryFilter, string> = {
  all: "All",
  action: "Action",
  custom: "Custom",
  doctype: "Doctype",
  standard: "Standard",
  utility: "Utility",
};

export const CATEGORY_CACHE_KEY = "salesforce-pilot-icons-category";

export const iconPngUrl = (category: IconCategory, name: string) =>
  `${SLDS_CDN_ROOT}/assets/icons/${category}/${name}_60.png`;

export const iconSvgUrl = (category: IconCategory, name: string) =>
  `${SLDS_CDN_ROOT}/assets/icons/${category}/${name}.svg`;
