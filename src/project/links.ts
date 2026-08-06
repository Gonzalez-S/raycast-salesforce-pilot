import { LocalStorage } from "@raycast/api";

import { ORG_PROJECTS_KEY } from "./constants";
import { type OrgProjectPrefs, type OrgProjectsMap, orgProjectsMapSchema } from "./schemas";

export const getOrgProjectsMap = async (): Promise<OrgProjectsMap> => {
  const raw = await LocalStorage.getItem<string>(ORG_PROJECTS_KEY);
  if (!raw) return {};

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }

  const parsed = orgProjectsMapSchema.safeParse(data);
  return parsed.success ? parsed.data : {};
};

export const replaceOrgProjectsMap = async (map: OrgProjectsMap) => {
  await LocalStorage.setItem(ORG_PROJECTS_KEY, JSON.stringify(map));
};

export const getOrgProjectPrefs = async (username: string): Promise<OrgProjectPrefs> => {
  const map = await getOrgProjectsMap();
  return map[username] ?? {};
};

const saveOrgProjectPrefs = async (username: string, prefs: OrgProjectPrefs) => {
  const map = await getOrgProjectsMap();
  const hasManual = (prefs.manualProjectIds?.length ?? 0) > 0;

  if (!hasManual) {
    delete map[username];
  } else {
    map[username] = { manualProjectIds: prefs.manualProjectIds };
  }

  await replaceOrgProjectsMap(map);
};

export const addManualProject = async (username: string, projectId: string) => {
  const prefs = await getOrgProjectPrefs(username);
  const manualProjectIds = new Set(prefs.manualProjectIds ?? []);
  manualProjectIds.add(projectId);
  await saveOrgProjectPrefs(username, { manualProjectIds: [...manualProjectIds] });
};

export const removeManualProject = async (username: string, projectId: string) => {
  const prefs = await getOrgProjectPrefs(username);
  const manualProjectIds = (prefs.manualProjectIds ?? []).filter((id) => id !== projectId);
  await saveOrgProjectPrefs(username, { manualProjectIds });
};

export const clearOrgProjectPrefs = async (username: string) => {
  const map = await getOrgProjectsMap();
  delete map[username];
  await replaceOrgProjectsMap(map);
};
