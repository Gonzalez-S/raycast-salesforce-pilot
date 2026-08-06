import { LocalStorage } from "@raycast/api";

import { ORG_SETTINGS_KEY } from "./constants";
import { type OrgDisplaySettings, type OrgSettingsMap, orgSettingsMapSchema } from "./schemas";

export const getSettingsMap = async (): Promise<OrgSettingsMap> => {
  const raw = await LocalStorage.getItem<string>(ORG_SETTINGS_KEY);
  if (!raw) return {};

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }

  const parsed = orgSettingsMapSchema.safeParse(data);
  return parsed.success ? parsed.data : {};
};

export const replaceSettingsMap = async (settings: OrgSettingsMap) => {
  await LocalStorage.setItem(ORG_SETTINGS_KEY, JSON.stringify(settings));
};

/** Saves form display fields; preserves pin if already set. */
export const saveSettings = async (username: string, settings: OrgDisplaySettings) => {
  const all = await getSettingsMap();
  all[username] = { ...all[username], ...settings };
  await replaceSettingsMap(all);
};

export const setPinned = async (username: string, pinned: boolean) => {
  const all = await getSettingsMap();
  const previous = all[username] ?? {};
  all[username] = {
    label: previous.label,
    color: previous.color,
    group: previous.group,
    pinned,
  };
  await replaceSettingsMap(all);
};

export const clearSettings = async (username: string) => {
  const all = await getSettingsMap();
  delete all[username];
  await replaceSettingsMap(all);
};
