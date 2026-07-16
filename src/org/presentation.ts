import { Color, List } from "@raycast/api";

import { EXPIRATION_WARN_DAYS, MS_PER_DAY } from "./constants";
import type { Org } from "./schemas";

export const title = (org: Org) => org.label || org.alias;

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
export const daysUntil = (expirationDate?: string): number | null => {
  if (!expirationDate) return null;
  const [y, m, d] = expirationDate.split("-").map(Number);
  const expires = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((expires.getTime() - today.getTime()) / MS_PER_DAY);
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
