import * as sf from "../cli/sf";

import {
  DEFAULT_GROUP,
  DEFAULT_PRODUCTION_COLOR,
  DEFAULT_SANDBOX_COLOR,
  LOGIN_URLS,
  ORG_KIND_ORDER,
  type OrgKind,
} from "./constants";
import { classifyKind } from "./kind";
import {
  type LoginHost,
  type Org,
  type OrgDisplaySettings,
  type SfAliasRow,
  type SfOrgRow,
  type StoredOrgSettings,
  orgAuthResultSchema,
  orgListResultSchema,
  orgSchema,
  parseColorValue,
  sfAliasListResultSchema,
} from "./schemas";
import * as settings from "./settings";
import * as projectLinks from "../project/links";

const defaultColorForKind = (kind: OrgKind) =>
  kind === "sandbox" || kind === "scratch" ? DEFAULT_SANDBOX_COLOR : DEFAULT_PRODUCTION_COLOR;

/** Invert `sf alias list` into username → every alias that points at it. */
export const aliasesByUsername = (rows: SfAliasRow[]): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const username = row.value.trim();
    const alias = row.alias.trim();
    if (!username || !alias) continue;
    const existing = map.get(username) ?? [];
    if (!existing.includes(alias)) existing.push(alias);
    map.set(username, existing);
  }
  return map;
};

const resolveAliases = (username: string, primaryAlias: string, aliasMap: Map<string, string[]>): string[] => {
  const fromMap = aliasMap.get(username) ?? [];
  const aliases = [...fromMap];
  if (primaryAlias && !aliases.includes(primaryAlias)) aliases.unshift(primaryAlias);
  return aliases;
};

const toOrg = (
  row: SfOrgRow,
  kind: OrgKind,
  stored: StoredOrgSettings = {},
  aliasMap: Map<string, string[]> = new Map(),
): Org => {
  const primaryAlias = row.alias || row.username;
  return orgSchema.parse({
    username: row.username,
    alias: primaryAlias,
    aliases: resolveAliases(row.username, primaryAlias, aliasMap),
    instanceUrl: row.instanceUrl || "",
    orgId: row.orgId ?? undefined,
    orgName: row.name ?? undefined,
    orgEdition: row.orgEdition ?? undefined,
    connectedStatus: row.connectedStatus ?? undefined,
    expirationDate: row.expirationDate ?? row.trailExpirationDate ?? undefined,
    lastUsed: row.lastUsed ?? undefined,
    isDefaultOrg: row.isDefaultUsername === true,
    isDefaultDevHub: row.isDefaultDevHubUsername === true,
    kind,
    group: stored.group?.trim() || DEFAULT_GROUP,
    label: stored.label,
    color: parseColorValue(stored.color) ?? defaultColorForKind(kind),
    pinned: stored.pinned === true,
  });
};

const mergeOrg = (existing: Org | undefined, next: Org): Org => {
  if (!existing) return next;
  // Prefer the richer / higher-priority kind when the same username appears in multiple buckets.
  const preferred = ORG_KIND_ORDER[next.kind] < ORG_KIND_ORDER[existing.kind] ? next : existing;
  const other = preferred === next ? existing : next;
  const aliases = [...new Set([...preferred.aliases, ...other.aliases])];
  return { ...preferred, aliases };
};

export const authenticate = async (alias: string, loginHost: LoginHost, displaySettings: OrgDisplaySettings) => {
  const result = await sf.exec(
    ["org", "login", "web", "--alias", alias, "--instance-url", LOGIN_URLS[loginHost]],
    orgAuthResultSchema,
  );
  await settings.saveSettings(result.username, displaySettings);
};

export const list = async (): Promise<Org[]> => {
  const [result, settingsMap, aliasRows] = await Promise.all([
    sf.exec(["org", "list", "--all"], orgListResultSchema),
    settings.getSettingsMap(),
    sf.exec(["alias", "list"], sfAliasListResultSchema).catch(() => [] as SfAliasRow[]),
  ]);

  const aliasMap = aliasesByUsername(aliasRows);
  const byUsername = new Map<string, Org>();

  const ingest = (rows: SfOrgRow[] | undefined, bucket: string) => {
    for (const row of rows ?? []) {
      const kind = classifyKind(row, bucket);
      const next = toOrg(row, kind, settingsMap[row.username], aliasMap);
      byUsername.set(row.username, mergeOrg(byUsername.get(row.username), next));
    }
  };

  // Low → high priority so Dev Hub / production classifications win over duplicates.
  ingest(result.other, "other");
  ingest(result.scratchOrgs, "scratchOrgs");
  ingest(result.sandboxes, "sandboxes");
  ingest(result.nonScratchOrgs, "nonScratchOrgs");
  ingest(result.devHubs, "devHubs");

  return [...byUsername.values()];
};

export const open = (org: Org, path: string) =>
  sf.exec(["org", "open", "--target-org", org.alias, "--path", path], false);

export const logout = async (org: Org) => {
  await sf.exec(["org", "logout", "--target-org", org.username, "--no-prompt"], false);
  await settings.clearSettings(org.username);
  await projectLinks.clearOrgProjectPrefs(org.username);
};

export const saveSettings = settings.saveSettings;
export const setPinned = settings.setPinned;
