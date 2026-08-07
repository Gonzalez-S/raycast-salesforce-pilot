import type { Org } from "../org/schemas";
import type { CatalogEntry, OrgAttachment } from "./schemas";

const normalizeOrgKey = (value: string): string => value.trim().toLowerCase();

/** Match keys: username + every CLI alias (not just the primary `sf org list` alias). */
const orgKeys = (org: Org): string[] => {
  const keys = new Set<string>();
  keys.add(normalizeOrgKey(org.username));
  if (org.alias) keys.add(normalizeOrgKey(org.alias));
  for (const alias of org.aliases ?? []) {
    if (alias) keys.add(normalizeOrgKey(alias));
  }
  return [...keys];
};

const entryMatchesOrg = (entry: CatalogEntry, org: Org): boolean => {
  const targets = entry.targetOrgs ?? [];
  if (targets.length === 0) return false;
  const keys = new Set(orgKeys(org));
  return targets.some((target) => keys.has(normalizeOrgKey(target)));
};

export const resolveOrgAttachments = (org: Org, catalog: CatalogEntry[]): OrgAttachment[] => {
  const attachments: OrgAttachment[] = [];

  for (const entry of catalog) {
    if (!entryMatchesOrg(entry, org)) continue;
    attachments.push({ entry });
  }

  return attachments.sort((a, b) => a.entry.name.localeCompare(b.entry.name));
};

export const resolveAttachmentsForOrgs = (orgs: Org[], catalog: CatalogEntry[]): Record<string, OrgAttachment[]> => {
  const result: Record<string, OrgAttachment[]> = {};

  for (const org of orgs) {
    result[org.username] = resolveOrgAttachments(org, catalog);
  }

  return result;
};

export const countMatchedOrgs = (catalog: CatalogEntry[], orgs: Org[]): number => {
  const usernames = new Set<string>();
  for (const org of orgs) {
    if (resolveOrgAttachments(org, catalog).length > 0) usernames.add(org.username);
  }
  return usernames.size;
};
