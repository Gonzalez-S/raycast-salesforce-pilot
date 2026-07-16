import { Alert, Color, confirmAlert, Icon, List, LocalStorage } from "@raycast/api";

import {
  DEFAULT_COLOR,
  DEFAULT_SECTION,
  EXPIRATION_WARN_DAYS,
  LOGIN_URLS,
  MS_PER_DAY,
  ORG_SETTINGS_KEY,
} from "./constants";
import {
  type LoginHost,
  type Org,
  type OrgDisplaySettings,
  type OrgSettingsMap,
  type SfOrgRow,
  type StoredOrgSettings,
  orgAuthResultSchema,
  orgListResultSchema,
  orgSchema,
  orgSettingsMapSchema,
} from "./schemas";
import * as sf from "./sf";
import * as utils from "./utils";

const getSettingsMap = async (): Promise<OrgSettingsMap> => {
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

const setSettingsMap = async (settings: OrgSettingsMap) => {
  await LocalStorage.setItem(ORG_SETTINGS_KEY, JSON.stringify(settings));
};

export const saveSettings = async (username: string, settings: OrgDisplaySettings) => {
  const all = await getSettingsMap();
  all[username] = settings;
  await setSettingsMap(all);
};

const clearSettings = async (username: string) => {
  const all = await getSettingsMap();
  delete all[username];
  await setSettingsMap(all);
};

const toOrg = (row: SfOrgRow, settings: StoredOrgSettings = {}): Org =>
  orgSchema.parse({
    username: row.username,
    alias: row.alias || row.username,
    instanceUrl: row.instanceUrl || "",
    expirationDate: row.expirationDate ?? row.trailExpirationDate ?? undefined,
    label: settings.label,
    color: settings.color ?? DEFAULT_COLOR,
    section: settings.section ?? DEFAULT_SECTION,
  });

export const title = (org: Org) => org.label || org.alias;

export const applySettings = (orgs: Org[], username: string, settings: OrgDisplaySettings) =>
  orgs
    .map((org) => (org.username === username ? { ...org, ...settings } : org))
    .sort((a, b) => (a.label || a.alias).localeCompare(b.label || b.alias));

export const authenticate = async (alias: string, loginHost: LoginHost, settings: OrgDisplaySettings) => {
  const result = await sf.exec(
    ["org", "login", "web", "--alias", alias, "--instance-url", LOGIN_URLS[loginHost]],
    orgAuthResultSchema,
  );
  await saveSettings(result.username, settings);
};

export const list = async (): Promise<Org[]> => {
  const [result, settings] = await Promise.all([
    sf.exec(["org", "list", "--all"], orgListResultSchema),
    getSettingsMap(),
  ]);

  const rows = [
    ...(result.devHubs ?? []),
    ...(result.nonScratchOrgs ?? []),
    ...(result.sandboxes ?? []),
    ...(result.scratchOrgs ?? []),
    ...(result.other ?? []),
  ];

  const byUsername = new Map<string, Org>();
  for (const row of rows) {
    byUsername.set(row.username, toOrg(row, settings[row.username]));
  }

  return [...byUsername.values()].sort((a, b) => (a.label || a.alias).localeCompare(b.label || b.alias));
};

export const groupBySection = (orgList: Org[]) => {
  const map: Record<string, Org[]> = {};

  for (const org of orgList) {
    map[org.section] ??= [];
    map[org.section].push(org);
  }

  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, sectionOrgs: map[name] }));
};

/** Days until YYYY-MM-DD expiration, or null if none. */
const daysUntil = (expirationDate?: string): number | null => {
  if (!expirationDate) return null;
  const [y, m, d] = expirationDate.split("-").map(Number);
  const expires = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expires.getTime() - today.getTime()) / MS_PER_DAY);
};

export const open = (org: Org, path: string) =>
  utils.withAnimatedToast(`Opening ${title(org)}…`, async () => {
    await sf.exec(["org", "open", "--target-org", org.alias, "--path", path], false);
  });

export const logout = async (org: Org) => {
  await sf.exec(["org", "logout", "--target-org", org.username, "--no-prompt"], false);
  await clearSettings(org.username);
};

export const remove = async (org: Org, onDone: () => void) => {
  const confirmed = await confirmAlert({
    title: `Delete ${title(org)}?`,
    message: "Removes the org from the SF CLI keystore. You can re-authenticate later.",
    icon: Icon.Trash,
    primaryAction: { title: "Delete", style: Alert.ActionStyle.Destructive },
  });
  if (!confirmed) return;

  await utils.withAnimatedToast("Deleting…", async () => {
    await logout(org);
    onDone();
  });
};

export const accessories = (org: Org): List.Item.Accessory[] => {
  const days = daysUntil(org.expirationDate);
  if (days === null) return [];

  if (days <= 0) {
    return [{ tag: { value: "Expired", color: Color.Red } }];
  }

  if (days <= EXPIRATION_WARN_DAYS) {
    return [{ tag: { value: `${days}d left`, color: Color.Yellow } }];
  }

  return [];
};
