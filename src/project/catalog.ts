import { LocalStorage } from "@raycast/api";

import { MANUAL_CATALOG_KEY, PROJECT_CATALOG_KEY } from "./constants";
import {
  type CatalogEntry,
  type ManualCatalog,
  type ProjectCatalog,
  catalogEntrySchema,
  manualCatalogSchema,
  projectCatalogSchema,
} from "./schemas";

const parseCatalog = (raw: string | undefined): ProjectCatalog | undefined => {
  if (!raw) return undefined;

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return undefined;
  }

  const parsed = projectCatalogSchema.safeParse(data);
  return parsed.success ? parsed.data : undefined;
};

const parseManualCatalog = (raw: string | undefined): ManualCatalog => {
  if (!raw) return {};

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }

  const parsed = manualCatalogSchema.safeParse(data);
  return parsed.success ? parsed.data : {};
};

export const getProjectCatalog = async (): Promise<ProjectCatalog | undefined> => {
  const raw = await LocalStorage.getItem<string>(PROJECT_CATALOG_KEY);
  return parseCatalog(raw);
};

export const saveProjectCatalog = async (catalog: ProjectCatalog) => {
  await LocalStorage.setItem(PROJECT_CATALOG_KEY, JSON.stringify(catalog));
};

export const getManualCatalog = async (): Promise<ManualCatalog> => {
  const raw = await LocalStorage.getItem<string>(MANUAL_CATALOG_KEY);
  return parseManualCatalog(raw);
};

export const replaceManualCatalog = async (catalog: ManualCatalog) => {
  await LocalStorage.setItem(MANUAL_CATALOG_KEY, JSON.stringify(catalog));
};

export const upsertManualEntry = async (entry: CatalogEntry): Promise<CatalogEntry> => {
  const parsed = catalogEntrySchema.parse({ ...entry, source: "manual" });
  const catalog = await getManualCatalog();
  catalog[parsed.id] = parsed;
  await replaceManualCatalog(catalog);
  return parsed;
};

const getAllCatalogEntries = async (): Promise<CatalogEntry[]> => {
  const [autoCatalog, manualCatalog] = await Promise.all([getProjectCatalog(), getManualCatalog()]);
  const byId = new Map<string, CatalogEntry>();

  for (const entry of autoCatalog?.entries ?? []) {
    byId.set(entry.id, entry);
  }
  for (const entry of Object.values(manualCatalog)) {
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }

  return [...byId.values()];
};

export const loadCatalogEntries = async (): Promise<CatalogEntry[]> => {
  const { access } = await import("fs/promises");
  const entries = await getAllCatalogEntries();

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
