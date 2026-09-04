import { type Application, LocalStorage } from "@raycast/api";
import * as z from "zod/mini";

import { OPEN_IN_RECENTS_KEY } from "./constants";

/** bundleId (preferred) or app path → last-used epoch ms. */
export const openInRecentsSchema = z.record(z.string(), z.number());

export type OpenInRecents = z.infer<typeof openInRecentsSchema>;

/** Stable id for matching a browser across launches. */
export const browserKey = (browser: Pick<Application, "bundleId" | "path">): string =>
  browser.bundleId?.trim() || browser.path;

export const getOpenInRecents = async (): Promise<OpenInRecents> => {
  const raw = await LocalStorage.getItem<string>(OPEN_IN_RECENTS_KEY);
  if (!raw) return {};

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }

  const parsed = openInRecentsSchema.safeParse(data);
  return parsed.success ? parsed.data : {};
};

export const rememberOpenInBrowser = async (browser: Application) => {
  const key = browserKey(browser);
  if (!key) return;

  const recents = await getOpenInRecents();
  recents[key] = Date.now();
  await LocalStorage.setItem(OPEN_IN_RECENTS_KEY, JSON.stringify(recents));
};

/**
 * Recently used first (newest timestamp wins); never-used keep A–Z order among themselves.
 */
export const sortBrowsersByRecents = (browsers: Application[], recents: OpenInRecents): Application[] =>
  [...browsers].sort((a, b) => {
    const aTime = recents[browserKey(a)] ?? 0;
    const bTime = recents[browserKey(b)] ?? 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
