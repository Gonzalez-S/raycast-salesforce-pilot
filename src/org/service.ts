import * as sf from "../cli/sf";

import { DEFAULT_COLOR, DEFAULT_SECTION, LOGIN_URLS } from "./constants";
import {
  type LoginHost,
  type Org,
  type OrgDisplaySettings,
  type SfOrgRow,
  type StoredOrgSettings,
  orgAuthResultSchema,
  orgListResultSchema,
  orgSchema,
} from "./schemas";
import * as settings from "./settings";

const toOrg = (row: SfOrgRow, stored: StoredOrgSettings = {}): Org =>
  orgSchema.parse({
    username: row.username,
    alias: row.alias || row.username,
    instanceUrl: row.instanceUrl || "",
    expirationDate: row.expirationDate ?? row.trailExpirationDate ?? undefined,
    label: stored.label,
    color: stored.color ?? DEFAULT_COLOR,
    section: stored.section ?? DEFAULT_SECTION,
  });

const byDisplayName = (a: Org, b: Org) => (a.label || a.alias).localeCompare(b.label || b.alias);

export const authenticate = async (alias: string, loginHost: LoginHost, displaySettings: OrgDisplaySettings) => {
  const result = await sf.exec(
    ["org", "login", "web", "--alias", alias, "--instance-url", LOGIN_URLS[loginHost]],
    orgAuthResultSchema,
  );
  await settings.saveSettings(result.username, displaySettings);
};

export const list = async (): Promise<Org[]> => {
  const [result, settingsMap] = await Promise.all([
    sf.exec(["org", "list", "--all"], orgListResultSchema),
    settings.getSettingsMap(),
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
    byUsername.set(row.username, toOrg(row, settingsMap[row.username]));
  }

  return [...byUsername.values()].sort(byDisplayName);
};

export const open = (org: Org, path: string) =>
  sf.exec(["org", "open", "--target-org", org.alias, "--path", path], false);

export const logout = async (org: Org) => {
  await sf.exec(["org", "logout", "--target-org", org.username, "--no-prompt"], false);
  await settings.clearSettings(org.username);
};

export const saveSettings = settings.saveSettings;
