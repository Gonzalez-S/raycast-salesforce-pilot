import { CACHE_KEY } from "../slds/constants";
import { getOrFetch } from "../slds/cache";
import {
  ICON_CATEGORIES,
  ICONS_CATALOG_URL,
  type IconCategory,
  type IconCategoryFilter,
  iconPngUrl,
  iconSvgUrl,
} from "./constants";

export type SalesforceIcon = {
  category: IconCategory;
  name: string;
  /** lightning-icon / LWC form, e.g. `utility:add` */
  apiName: string;
  pngUrl: string;
  svgUrl: string;
};

type CatalogSprite = {
  name: string;
  icons: Array<{ sprite: string; symbol: string }>;
};

const isIconCategory = (value: string): value is IconCategory => (ICON_CATEGORIES as readonly string[]).includes(value);

/** Normalize the SLDS `ui.icons.json` payload into a flat, sorted icon list. */
export const parseCatalog = (payload: unknown): SalesforceIcon[] => {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected Salesforce icons catalog shape");
  }

  const icons: SalesforceIcon[] = [];
  for (const sprite of payload as CatalogSprite[]) {
    if (!sprite || typeof sprite.name !== "string" || !Array.isArray(sprite.icons)) continue;
    if (!isIconCategory(sprite.name)) continue;

    for (const entry of sprite.icons) {
      const name = entry?.symbol;
      if (typeof name !== "string" || name.length === 0) continue;
      icons.push({
        category: sprite.name,
        name,
        apiName: `${sprite.name}:${name}`,
        pngUrl: iconPngUrl(sprite.name, name),
        svgUrl: iconSvgUrl(sprite.name, name),
      });
    }
  }

  icons.sort((a, b) => a.apiName.localeCompare(b.apiName));
  return icons;
};

const fetchCatalog = async (): Promise<SalesforceIcon[]> => {
  const response = await fetch(ICONS_CATALOG_URL);
  if (!response.ok) {
    throw new Error(`Couldn’t download icons catalog (${response.status})`);
  }
  return parseCatalog(await response.json());
};

export const loadIconCatalog = (options?: { force?: boolean }) =>
  getOrFetch(CACHE_KEY.iconsCatalog, fetchCatalog, options);

export const filterIcons = (icons: SalesforceIcon[], category: IconCategoryFilter): SalesforceIcon[] =>
  category === "all" ? icons : icons.filter((icon) => icon.category === category);
