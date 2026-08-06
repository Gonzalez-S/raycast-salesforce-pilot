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
  type SfOrgRow,
  type StoredOrgSettings,
  orgAuthResultSchema,
  orgListResultSchema,
  orgSchema,
} from "./schemas";
import * as settings from "./settings";

const defaultColorForKind = (kind: OrgKind) =>
  kind === "sandbox" || kind === "scratch" ? DEFAULT_SANDBOX_COLOR : DEFAULT_PRODUCTION_COLOR;

const toOrg = (row: SfOrgRow, kind: OrgKind, stored: StoredOrgSettings = {}): Org =>
  orgSchema.parse({
    username: row.username,
    alias: row.alias || row.username,
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
    color: stored.color ?? defaultColorForKind(kind),
    favorite: stored.favorite ?? false,
  });

const mergeOrg = (existing: Org | undefined, next: Org): Org => {
  if (!existing) return next;
  // Prefer the richer / higher-priority kind when the same username appears in multiple buckets.
  return ORG_KIND_ORDER[next.kind] < ORG_KIND_ORDER[existing.kind] ? next : existing;
};

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

  const byUsername = new Map<string, Org>();

  const ingest = (rows: SfOrgRow[] | undefined, bucket: string) => {
    for (const row of rows ?? []) {
      const kind = classifyKind(row, bucket);
      const next = toOrg(row, kind, settingsMap[row.username]);
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
};

export const saveSettings = settings.saveSettings;
export const setFavorite = settings.setFavorite;
