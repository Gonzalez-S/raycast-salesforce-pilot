import { Color, Icon, List } from "@raycast/api";

import {
  ALL_SCOPE,
  DEFAULT_GROUP,
  EXPIRATION_WARN_DAYS,
  MS_PER_DAY,
  ORG_KIND_LABEL,
  ORG_KIND_ORDER,
  PINS_SECTION,
  RECENT_SCOPE,
  type OrgKind,
} from "./constants";
import { ORG_KIND_COLOR, ORG_KIND_ICON } from "./kind";
import type { Org } from "./schemas";

export type OrgListSection = {
  id: string;
  title: string;
  orgs: Org[];
};

export type ScopeOption = {
  id: string;
  title: string;
};

export const title = (org: Org) => org.label || org.alias;

/** Org name with edition, e.g. "Acme Comp, Enterprise Edition". */
export const orgNameLabel = (org: Org): string | undefined => {
  const parts = [org.orgName, org.orgEdition].filter((part): part is string => Boolean(part?.trim()));
  return parts.length > 0 ? parts.join(", ") : undefined;
};

export const kindLabel = (kind: OrgKind) => ORG_KIND_LABEL[kind];
export const kindIcon = (kind: OrgKind) => ORG_KIND_ICON[kind];
export const kindColor = (kind: OrgKind) => ORG_KIND_COLOR[kind];

/** Type first, then display name. */
export const compareOrgs = (a: Org, b: Org): number => {
  const kindDiff = ORG_KIND_ORDER[a.kind] - ORG_KIND_ORDER[b.kind];
  if (kindDiff !== 0) return kindDiff;
  return title(a).localeCompare(title(b));
};

/** Newest lastUsed first; missing timestamps sink to the bottom. */
export const compareByLastUsed = (a: Org, b: Org): number => {
  const aTime = a.lastUsed ? Date.parse(a.lastUsed) : 0;
  const bTime = b.lastUsed ? Date.parse(b.lastUsed) : 0;
  if (aTime !== bTime) return bTime - aTime;
  return title(a).localeCompare(title(b));
};

/** Group names A–Z, with the default "Other" bucket always last. */
export const compareGroupNames = (a: string, b: string): number => {
  if (a === DEFAULT_GROUP && b !== DEFAULT_GROUP) return 1;
  if (b === DEFAULT_GROUP && a !== DEFAULT_GROUP) return -1;
  return a.localeCompare(b);
};

const groupByManualGroup = (orgs: Org[]): Map<string, Org[]> => {
  const map = new Map<string, Org[]>();
  for (const org of orgs) {
    const bucket = map.get(org.group) ?? [];
    bucket.push(org);
    map.set(org.group, bucket);
  }
  return map;
};

/** Distinct manual groups for the scope dropdown (Other last). Always includes Other. */
export const scopeOptions = (orgs: Org[]): ScopeOption[] => {
  const names = new Set<string>([DEFAULT_GROUP, ...orgs.map((org) => org.group)]);
  return [...names].sort(compareGroupNames).map((name) => ({ id: name, title: name }));
};

/**
 * Builds list sections for the current dropdown scope.
 * - Recents: flat list by lastUsed (no pins / group sections)
 * - Otherwise: Pins first, then manual groups (scoped or all)
 */
export const listSections = (orgs: Org[], scope: string): OrgListSection[] => {
  if (scope === RECENT_SCOPE) {
    return [{ id: RECENT_SCOPE, title: "Recent", orgs: [...orgs].sort(compareByLastUsed) }];
  }

  const pins = orgs.filter((org) => org.pinned).sort(compareOrgs);
  const rest = orgs.filter((org) => !org.pinned);
  const scoped = scope === ALL_SCOPE ? rest : rest.filter((org) => org.group === scope);

  const sections: OrgListSection[] = [];
  if (pins.length > 0) {
    sections.push({ id: PINS_SECTION, title: PINS_SECTION, orgs: pins });
  }

  const groups = [...groupByManualGroup(scoped).entries()]
    .map(([name, members]) => ({
      id: `group:${name}`,
      title: name,
      orgs: members.sort(compareOrgs),
    }))
    .sort((a, b) => compareGroupNames(a.title, b.title));

  sections.push(...groups);
  return sections;
};

/** Days until YYYY-MM-DD expiration, or null if none. */
export const daysUntil = (expirationDate?: string): number | null => {
  if (!expirationDate) return null;
  const [y, m, d] = expirationDate.split("-").map(Number);
  const expires = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expires.getTime() - today.getTime()) / MS_PER_DAY);
};

export const accessories = (
  org: Org,
  options?: { showGroup?: boolean; showPinIcon?: boolean },
): List.Item.Accessory[] => {
  const items: List.Item.Accessory[] = [];

  if (options?.showPinIcon && org.pinned) {
    items.push({ icon: Icon.Pin, tooltip: "Pinned" });
  }

  // Icon-only type cue on the row; label lives in the tooltip and detail tags.
  items.push({ icon: kindIcon(org.kind), tooltip: kindLabel(org.kind) });

  if (options?.showGroup) {
    items.push({ tag: org.group, icon: Icon.Folder, tooltip: "Group" });
  }

  const days = daysUntil(org.expirationDate);
  if (days === null) return items;

  if (days <= 0) {
    items.push({ tag: { value: "Expired", color: Color.Red }, icon: Icon.Warning });
    return items;
  }

  if (days <= EXPIRATION_WARN_DAYS) {
    items.push({ tag: { value: `${days}d left`, color: Color.Yellow }, icon: Icon.Clock });
  }

  return items;
};
