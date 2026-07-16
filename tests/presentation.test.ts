import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_COLOR, DEFAULT_SECTION } from "../src/org/constants";
import { accessories, daysUntil, groupBySection, title } from "../src/org/presentation";
import type { Org } from "../src/org/schemas";

const org = (overrides: Partial<Org> & Pick<Org, "username" | "alias">): Org => ({
  instanceUrl: "https://example.my.salesforce.com",
  color: DEFAULT_COLOR,
  section: DEFAULT_SECTION,
  ...overrides,
});

describe("title", () => {
  it("prefers label over alias", () => {
    expect(title(org({ username: "u", alias: "alias", label: "Label" }))).toBe("Label");
    expect(title(org({ username: "u", alias: "alias" }))).toBe("alias");
  });
});

describe("groupBySection", () => {
  it("groups orgs and sorts section names", () => {
    const groups = groupBySection([
      org({ username: "a", alias: "a", section: "Prod" }),
      org({ username: "b", alias: "b", section: "Dev" }),
      org({ username: "c", alias: "c", section: "Prod" }),
    ]);

    expect(groups.map((g) => g.name)).toEqual(["Dev", "Prod"]);
    expect(groups[1].sectionOrgs.map((o) => o.username)).toEqual(["a", "c"]);
  });
});

describe("daysUntil / accessories", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null when there is no expiration", () => {
    expect(daysUntil(undefined)).toBeNull();
    expect(accessories(org({ username: "u", alias: "a" }))).toEqual([]);
  });

  it("flags expired and soon-to-expire orgs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 16)); // Jul 16, 2026 local

    expect(daysUntil("2026-07-10")).toBeLessThanOrEqual(0);
    expect(accessories(org({ username: "u", alias: "a", expirationDate: "2026-07-10" }))).toEqual([
      { tag: { value: "Expired", color: "red" } },
    ]);

    expect(daysUntil("2026-07-20")).toBe(4);
    expect(accessories(org({ username: "u", alias: "a", expirationDate: "2026-07-20" }))).toEqual([
      { tag: { value: "4d left", color: "yellow" } },
    ]);

    expect(accessories(org({ username: "u", alias: "a", expirationDate: "2026-08-16" }))).toEqual([]);
  });
});
