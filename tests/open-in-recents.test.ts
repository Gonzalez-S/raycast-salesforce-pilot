import { describe, expect, it } from "vitest";

import type { Application } from "@raycast/api";

import { browserKey, sortBrowsersByRecents } from "../src/org/open-in-recents";

const app = (name: string, overrides: Partial<Application> = {}): Application => ({
  name,
  path: `/Applications/${name}.app`,
  bundleId: `com.example.${name.toLowerCase()}`,
  ...overrides,
});

describe("browserKey", () => {
  it("prefers bundleId over path", () => {
    expect(browserKey(app("Safari", { bundleId: "com.apple.Safari" }))).toBe("com.apple.Safari");
  });

  it("falls back to path when bundleId is missing", () => {
    expect(browserKey(app("Odd", { bundleId: undefined }))).toBe("/Applications/Odd.app");
  });
});

describe("sortBrowsersByRecents", () => {
  it("orders by newest recent first, then A–Z for unused", () => {
    const chrome = app("Chrome");
    const firefox = app("Firefox");
    const safari = app("Safari");
    const arc = app("Arc");

    const sorted = sortBrowsersByRecents([chrome, firefox, safari, arc], {
      [browserKey(safari)]: 300,
      [browserKey(chrome)]: 100,
    });

    expect(sorted.map((item) => item.name)).toEqual(["Safari", "Chrome", "Arc", "Firefox"]);
  });

  it("falls back to name order when no recents", () => {
    const sorted = sortBrowsersByRecents([app("Zebra"), app("Alpha")], {});
    expect(sorted.map((item) => item.name)).toEqual(["Alpha", "Zebra"]);
  });
});
