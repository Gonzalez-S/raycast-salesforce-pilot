import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ALL_SCOPE,
  DEFAULT_GROUP,
  DEFAULT_PRODUCTION_COLOR,
  DEFAULT_SANDBOX_COLOR,
  PINS_SECTION,
  RECENT_SCOPE,
} from "../src/org/constants";
import { classifyKind } from "../src/org/kind";
import {
  accessories,
  compareByLastUsed,
  compareGroupNames,
  compareOrgs,
  daysUntil,
  kindLabel,
  listSections,
  scopeOptions,
  title,
} from "../src/org/presentation";
import type { Org } from "../src/org/schemas";

const org = (overrides: Partial<Org> & Pick<Org, "username" | "alias" | "kind">): Org => ({
  instanceUrl: "https://example.my.salesforce.com",
  color: DEFAULT_SANDBOX_COLOR,
  pinned: false,
  group: DEFAULT_GROUP,
  isDefaultOrg: false,
  isDefaultDevHub: false,
  aliases: [overrides.alias],
  ...overrides,
});

describe("classifyKind", () => {
  it("prefers CLI flags over bucket names", () => {
    expect(classifyKind({ username: "a", isDevHub: true, isSandbox: false }, "nonScratchOrgs")).toBe("devhub");
    expect(classifyKind({ username: "a", isSandbox: true }, "nonScratchOrgs")).toBe("sandbox");
    expect(classifyKind({ username: "a", isScratch: true }, "other")).toBe("scratch");
    expect(classifyKind({ username: "a", isSandbox: false, isScratch: false }, "other")).toBe("production");
  });
});

describe("title / compareOrgs / compareByLastUsed", () => {
  it("prefers label, then sorts by kind and name", () => {
    expect(title(org({ username: "u", alias: "alias", kind: "sandbox", label: "Label" }))).toBe("Label");

    const prod = org({ username: "p", alias: "prod", kind: "production", group: "US" });
    const hub = org({ username: "h", alias: "hub", kind: "devhub", group: "US" });
    const sand = org({ username: "s", alias: "z-sand", kind: "sandbox", group: "US" });
    const sandA = org({ username: "s2", alias: "a-sand", kind: "sandbox", group: "US" });

    expect([sand, hub, sandA, prod].sort(compareOrgs).map((o) => o.alias)).toEqual([
      "hub",
      "prod",
      "a-sand",
      "z-sand",
    ]);
  });

  it("orders by lastUsed newest first", () => {
    const older = org({
      username: "a",
      alias: "older",
      kind: "sandbox",
      lastUsed: "2026-01-01T00:00:00.000Z",
    });
    const newer = org({
      username: "b",
      alias: "newer",
      kind: "sandbox",
      lastUsed: "2026-08-01T00:00:00.000Z",
    });
    const never = org({ username: "c", alias: "never", kind: "sandbox" });
    expect([older, never, newer].sort(compareByLastUsed).map((o) => o.alias)).toEqual(["newer", "older", "never"]);
  });
});

describe("listSections / scopeOptions", () => {
  const usHub = org({
    username: "u@acme.com",
    alias: "us-prod",
    kind: "devhub",
    group: "US",
    orgName: "Acme US",
    color: DEFAULT_PRODUCTION_COLOR,
  });
  const usSand = org({
    username: "u@acme.com.dev1",
    alias: "us-dev1",
    kind: "sandbox",
    group: "US",
  });
  const ukHub = org({
    username: "u@acme.co.uk",
    alias: "uk-prod",
    kind: "devhub",
    group: "UK",
    orgName: "Acme UK",
    color: DEFAULT_PRODUCTION_COLOR,
  });
  const flosum = org({
    username: "u@acme.com.flosum",
    alias: "flosum",
    kind: "production",
    group: "Other",
    label: "Flosum",
    pinned: true,
    color: DEFAULT_PRODUCTION_COLOR,
  });

  it("sorts group names with Other last", () => {
    expect(["US", DEFAULT_GROUP, "UK"].sort(compareGroupNames)).toEqual(["UK", "US", DEFAULT_GROUP]);
  });

  it("scopes by manual group while keeping pins visible", () => {
    const scopes = scopeOptions([usHub, usSand, ukHub, flosum]);
    expect(scopes.map((s) => s.title)).toEqual(["UK", "US", DEFAULT_GROUP]);

    const usOnly = listSections([usHub, usSand, ukHub, flosum], "US");
    expect(usOnly.map((s) => s.title)).toEqual([PINS_SECTION, "US"]);
    expect(usOnly[0].orgs.map((o) => o.alias)).toEqual(["flosum"]);
    expect(usOnly[1].orgs.map((o) => o.alias)).toEqual(["us-prod", "us-dev1"]);
    expect(usOnly.flatMap((s) => s.orgs).some((o) => o.alias === "uk-prod")).toBe(false);

    const all = listSections([usHub, usSand, ukHub, flosum], ALL_SCOPE);
    // Flosum is pinned (group Other), so Other has no remaining rows.
    expect(all.map((s) => s.title)).toEqual([PINS_SECTION, "UK", "US"]);
  });

  it("builds a flat recent list without group sections", () => {
    const withTimes = [
      { ...usHub, lastUsed: "2026-01-01T00:00:00.000Z" },
      { ...usSand, lastUsed: "2026-08-01T00:00:00.000Z" },
      { ...flosum, lastUsed: "2026-06-01T00:00:00.000Z" },
    ];
    const recent = listSections(withTimes, RECENT_SCOPE);
    expect(recent).toHaveLength(1);
    expect(recent[0].title).toBe("Recent");
    expect(recent[0].orgs.map((o) => o.alias)).toEqual(["us-dev1", "flosum", "us-prod"]);
  });
});

describe("daysUntil / accessories", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when there is no expiration", () => {
    expect(daysUntil(undefined)).toBeNull();
    expect(accessories(org({ username: "u", alias: "a", kind: "sandbox" })).some((a) => a.icon)).toBe(true);
  });

  it("flags expired and soon-to-expire orgs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 16));

    expect(daysUntil("2026-07-10")).toBeLessThanOrEqual(0);
    const expired = accessories(
      org({ username: "u", alias: "a", kind: "sandbox", expirationDate: "2026-07-10" }),
    );
    expect(expired).toContainEqual({ tag: { value: "Expired", color: "red" }, icon: "warning-16" });

    const soon = accessories(org({ username: "u", alias: "a", kind: "sandbox", expirationDate: "2026-07-20" }));
    expect(soon).toContainEqual({ tag: { value: "4d left", color: "yellow" }, icon: "clock-16" });
  });

  it("uses icon-only type accessories and omits pin in Pins section", () => {
    const pinned = org({ username: "u", alias: "a", kind: "production", pinned: true, group: "US" });
    expect(accessories(pinned, { showPinIcon: false, showGroup: true })).toEqual([
      { icon: "globe-16", tooltip: "Production" },
      { tag: "US", icon: "folder-16", tooltip: "Group" },
    ]);
  });

  it("shows default org and Dev Hub accessories", () => {
    const defaults = org({
      username: "u",
      alias: "hub",
      kind: "devhub",
      isDefaultOrg: true,
      isDefaultDevHub: true,
    });
    expect(accessories(defaults)).toEqual([
      { icon: "hammer-16", tooltip: "Dev Hub" },
      { icon: "check-circle-16", tooltip: "Default Org" },
      { icon: "hammer-16", tooltip: "Default Dev Hub" },
    ]);
  });

  it("labels kinds", () => {
    expect(kindLabel("devhub")).toBe("Dev Hub");
  });
});
