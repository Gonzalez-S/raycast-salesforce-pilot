import { type Application, getApplications, open as openTarget } from "@raycast/api";

import * as sf from "../cli/sf";

import {
  DEFAULT_GROUP,
  DEFAULT_PRODUCTION_COLOR,
  DEFAULT_SANDBOX_COLOR,
  ORG_KIND_ORDER,
  type OrgKind,
} from "./constants";
import { classifyKind } from "./kind";
import { getOpenInRecents, rememberOpenInBrowser, sortBrowsersByRecents } from "./open-in-recents";
import { rememberOpenLink } from "./open-link-recents";
import { resolveOpenLinks } from "./open-paths";
import {
  type Org,
  type OrgDisplaySettings,
  type SfAliasRow,
  type SfOrgRow,
  type StoredOrgSettings,
  aliasMutationResultSchema,
  configSetResultSchema,
  orgAuthResultSchema,
  orgListResultSchema,
  orgOpenUrlResultSchema,
  orgSchema,
  parseColorValue,
  sfAliasListResultSchema,
} from "./schemas";
import * as settings from "./settings";

/** Probe URL so `getApplications` returns browsers (and other URL handlers). */
const BROWSER_PROBE_URL = "https://login.salesforce.com";

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
    openLinks: resolveOpenLinks(stored.openLinks),
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

/** Prefer alias for CLI targeting; fall back to username. */
export const targetFor = (org: Org): string => org.alias || org.username;

export type AuthenticateInput = {
  alias: string;
  instanceUrl: string;
  setDefault?: boolean;
  setDefaultDevHub?: boolean;
  displaySettings: OrgDisplaySettings;
};

export const authenticate = async ({
  alias,
  instanceUrl,
  setDefault,
  setDefaultDevHub,
  displaySettings,
}: AuthenticateInput) => {
  const args = ["org", "login", "web", "--alias", alias, "--instance-url", instanceUrl];
  if (setDefault) args.push("--set-default");
  if (setDefaultDevHub) args.push("--set-default-dev-hub");

  const result = await sf.exec(args, orgAuthResultSchema);
  await settings.saveSettings(result.username, displaySettings);
  return result;
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

export const open = async (org: Org, path: string) => {
  await sf.exec(["org", "open", "--target-org", targetFor(org), "--path", path], false);
  await rememberOpenLink(org.username, path);
};

/** Resolve a one-time frontdoor URL for the org path (do not log or display). */
export const getOpenUrl = async (org: Org, path: string): Promise<string> => {
  const result = await sf.exec(
    ["org", "open", "--url-only", "--target-org", targetFor(org), "--path", path],
    orgOpenUrlResultSchema,
  );
  return result.url;
};

/** Installed apps that can open https URLs (usually browsers), recent first. */
export const listBrowsers = async (): Promise<Application[]> => {
  const [apps, recents] = await Promise.all([getApplications(BROWSER_PROBE_URL), getOpenInRecents()]);
  return sortBrowsersByRecents(apps, recents);
};

/** Open an org path in a specific browser via frontdoor URL. */
export const openInBrowser = async (org: Org, path: string, browser: Application) => {
  const url = await getOpenUrl(org, path);
  await openTarget(url, browser);
  await Promise.all([rememberOpenInBrowser(browser), rememberOpenLink(org.username, path)]);
};

export const setDefaultOrg = async (org: Org) => {
  await sf.exec(["config", "set", "--global", `target-org=${targetFor(org)}`], configSetResultSchema);
};

export const setDefaultDevHub = async (org: Org) => {
  await sf.exec(["config", "set", "--global", `target-dev-hub=${targetFor(org)}`], configSetResultSchema);
};

export const setAlias = async (org: Org, alias: string) => {
  await sf.exec(["alias", "set", `${alias}=${org.username}`], aliasMutationResultSchema);
};

export const unsetAlias = async (alias: string) => {
  await sf.exec(["alias", "unset", alias], aliasMutationResultSchema);
};

const deleteScratch = async (org: Org) => {
  await sf.exec(["org", "delete", "scratch", "--target-org", targetFor(org), "--no-prompt"], false);
  await settings.clearSettings(org.username);
};

const logout = async (org: Org) => {
  await sf.exec(["org", "logout", "--target-org", org.username, "--no-prompt"], false);
  await settings.clearSettings(org.username);
};

/** Scratch → delete on Dev Hub; other orgs → local logout only. */
export const remove = async (org: Org) => {
  if (org.kind === "scratch") {
    await deleteScratch(org);
    return;
  }
  await logout(org);
};

export const saveSettings = settings.saveSettings;
export const saveOpenLinks = settings.saveOpenLinks;
export const setPinned = settings.setPinned;
