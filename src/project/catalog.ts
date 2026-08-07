import { LocalStorage } from "@raycast/api";

import { LEGACY_MANUAL_CATALOG_KEY, LEGACY_ORG_PROJECTS_KEY, PROJECT_CATALOG_KEY } from "./constants";
import { type CatalogEntry, type ProjectCatalog, projectCatalogSchema } from "./schemas";

let legacyKeysCleared = false;

const clearLegacyManualProjectKeys = async () => {
  if (legacyKeysCleared) return;
  legacyKeysCleared = true;
  await Promise.all([
    LocalStorage.removeItem(LEGACY_MANUAL_CATALOG_KEY),
    LocalStorage.removeItem(LEGACY_ORG_PROJECTS_KEY),
  ]);
};

const parseCatalog = (raw: string | undefined): ProjectCatalog | undefined => {
  if (!raw) return undefined;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return undefined;
  }

  // Drop legacy `source` field from older scan catalogs.
  if (data && typeof data === "object" && Array.isArray((data as { entries?: unknown }).entries)) {
    const catalog = data as { entries: Record<string, unknown>[] };
    catalog.entries = catalog.entries.map((entry) => {
      const next = { ...entry };
      delete next.source;
      return next;
    });
  }

  const parsed = projectCatalogSchema.safeParse(data);
  return parsed.success ? parsed.data : undefined;
};

export const getProjectCatalog = async (): Promise<ProjectCatalog | undefined> => {
  await clearLegacyManualProjectKeys();
  const raw = await LocalStorage.getItem<string>(PROJECT_CATALOG_KEY);
  return parseCatalog(raw);
};

export const saveProjectCatalog = async (catalog: ProjectCatalog) => {
  await LocalStorage.setItem(PROJECT_CATALOG_KEY, JSON.stringify(catalog));
};

export const loadCatalogEntries = async (): Promise<CatalogEntry[]> => {
  const { access } = await import("fs/promises");
  const catalog = await getProjectCatalog();
  const entries = catalog?.entries ?? [];

  return Promise.all(
    entries.map(async (entry) => {
      try {
        await access(entry.path);
        return entry.missing ? { ...entry, missing: undefined } : entry;
      } catch {
        return entry.missing ? entry : { ...entry, missing: true };
      }
    }),
  );
};
