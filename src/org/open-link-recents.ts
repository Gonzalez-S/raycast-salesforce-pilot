import { LocalStorage } from "@raycast/api";
import * as z from "zod/mini";

import { OPEN_LINK_RECENTS_KEY } from "./constants";

/** username → path → last-used epoch ms. */
export const openLinkRecentsSchema = z.record(z.string(), z.record(z.string(), z.number()));

export type OpenLinkRecentsMap = z.infer<typeof openLinkRecentsSchema>;

export const getOpenLinkRecentsMap = async (): Promise<OpenLinkRecentsMap> => {
  const raw = await LocalStorage.getItem<string>(OPEN_LINK_RECENTS_KEY);
  if (!raw) return {};

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }

  const parsed = openLinkRecentsSchema.safeParse(data);
  return parsed.success ? parsed.data : {};
};

export const getOpenLinkRecents = async (username: string): Promise<Record<string, number>> => {
  const map = await getOpenLinkRecentsMap();
  return map[username] ?? {};
};

export const rememberOpenLink = async (username: string, path: string) => {
  const key = path.trim();
  if (!username || !key) return;

  const map = await getOpenLinkRecentsMap();
  const forOrg = { ...(map[username] ?? {}) };
  forOrg[key] = Date.now();
  map[username] = forOrg;
  await LocalStorage.setItem(OPEN_LINK_RECENTS_KEY, JSON.stringify(map));
};
