import * as z from "zod/mini";

import * as orgSettings from "../org/settings";
import { orgSettingsMapSchema, parseColorValue, type OrgSettingsMap } from "../org/schemas";

export const SETTINGS_EXPORT_VERSION = 2 as const;

const settingsExportInputSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  exportedAt: z.string(),
  orgSettings: orgSettingsMapSchema,
  // Ignored leftovers from v1 exports that included manual project links.
  orgProjects: z.optional(z.unknown()),
  manualCatalog: z.optional(z.unknown()),
});

export const settingsExportSchema = z.object({
  version: z.literal(SETTINGS_EXPORT_VERSION),
  exportedAt: z.string(),
  orgSettings: orgSettingsMapSchema,
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
  const orgSettingsMap = await orgSettings.getSettingsMap();

  return {
    version: SETTINGS_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    orgSettings: normalizeOrgSettings(orgSettingsMap),
  };
};

export const parseSettingsExport = (raw: string): SettingsExport => {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("File is not valid JSON");
  }

  const parsed = settingsExportInputSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("JSON is not a Salesforce Pilot settings export");
  }

  return {
    version: SETTINGS_EXPORT_VERSION,
    exportedAt: parsed.data.exportedAt,
    orgSettings: normalizeOrgSettings(parsed.data.orgSettings),
  };
};

/** Replace LocalStorage prefs from an export (does not touch the scan catalog). */
export const applySettingsExport = async (payload: SettingsExport): Promise<void> => {
  await orgSettings.replaceSettingsMap(payload.orgSettings);
};
