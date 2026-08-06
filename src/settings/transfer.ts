import * as z from "zod/mini";

import * as orgSettings from "../org/settings";
import { orgSettingsMapSchema, parseColorValue, type OrgSettingsMap } from "../org/schemas";
import * as catalog from "../project/catalog";
import * as links from "../project/links";
import { manualCatalogSchema, orgProjectsMapSchema } from "../project/schemas";

export const SETTINGS_EXPORT_VERSION = 1 as const;

export const settingsExportSchema = z.object({
  version: z.literal(SETTINGS_EXPORT_VERSION),
  exportedAt: z.string(),
  orgSettings: orgSettingsMapSchema,
  orgProjects: orgProjectsMapSchema,
  manualCatalog: manualCatalogSchema,
});

export type SettingsExport = z.infer<typeof settingsExportSchema>;

const normalizeOrgSettings = (map: OrgSettingsMap): OrgSettingsMap => {
  const normalized: OrgSettingsMap = {};

  for (const [username, settings] of Object.entries(map)) {
    normalized[username] = {
      label: settings.label,
      group: settings.group,
      pinned: settings.pinned,
      color: parseColorValue(settings.color),
    };
  }

  return normalized;
};

/** Build a portable JSON snapshot of extension LocalStorage prefs. */
export const buildSettingsExport = async (): Promise<SettingsExport> => {
  const [orgSettingsMap, orgProjects, manualCatalog] = await Promise.all([
    orgSettings.getSettingsMap(),
    links.getOrgProjectsMap(),
    catalog.getManualCatalog(),
  ]);

  return {
    version: SETTINGS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    orgSettings: normalizeOrgSettings(orgSettingsMap),
    orgProjects,
    manualCatalog,
  };
};

export const parseSettingsExport = (raw: string): SettingsExport => {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("File is not valid JSON");
  }

  const parsed = settingsExportSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("JSON is not a Salesforce Pilot settings export");
  }

  return {
    ...parsed.data,
    orgSettings: normalizeOrgSettings(parsed.data.orgSettings),
  };
};

/** Replace LocalStorage prefs from an export (does not touch the scan catalog). */
export const applySettingsExport = async (payload: SettingsExport): Promise<void> => {
  await Promise.all([
    orgSettings.replaceSettingsMap(payload.orgSettings),
    links.replaceOrgProjectsMap(payload.orgProjects),
    catalog.replaceManualCatalog(payload.manualCatalog),
  ]);
};
