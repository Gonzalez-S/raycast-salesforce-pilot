import { describe, expect, it } from "vitest";
import { Icon } from "@raycast/api";

import {
  DEFAULT_OPEN_LINKS,
  availableBuiltInOpenLinks,
  moveOpenLink,
  normalizeOpenLinks,
  resolveOpenLinks,
  sortOpenLinksByRecents,
} from "../src/org/open-paths";
import { openLinksSchema } from "../src/org/schemas";

describe("resolveOpenLinks", () => {
  it("defaults to the full catalog", () => {
    expect(resolveOpenLinks(undefined)).toEqual(DEFAULT_OPEN_LINKS);
    expect(resolveOpenLinks([])).toEqual(DEFAULT_OPEN_LINKS);
  });

  it("keeps custom links, icons, and order", () => {
    const custom = [
      { name: "Accounts", path: "/lightning/o/Account/list", icon: Icon.Person },
      { name: "Setup", path: "/lightning/setup/SetupOneHome/home", icon: Icon.WrenchScrewdriver },
    ];
    expect(resolveOpenLinks(custom)).toEqual(custom);
  });
});

describe("normalizeOpenLinks", () => {
  it("trims, drops blanks, dedupes by path, and fills icons", () => {
    expect(
      normalizeOpenLinks([
        { name: "  A  ", path: " /x " },
        { name: "", path: "/y" },
        { name: "B", path: "/x" },
        { name: "C", path: "/z", icon: Icon.Star },
      ]),
    ).toEqual([
      { name: "A", path: "/x", icon: Icon.Link },
      { name: "C", path: "/z", icon: Icon.Star },
    ]);
  });
});

describe("moveOpenLink", () => {
  it("swaps neighbors and no-ops at edges", () => {
    const links = [
      { name: "A", path: "/a", icon: Icon.Link },
      { name: "B", path: "/b", icon: Icon.Link },
      { name: "C", path: "/c", icon: Icon.Link },
    ];
    expect(moveOpenLink(links, 1, -1).map((l) => l.path)).toEqual(["/b", "/a", "/c"]);
    expect(moveOpenLink(links, 0, -1)).toEqual(links);
  });
});

describe("availableBuiltInOpenLinks", () => {
  it("returns defaults not already present", () => {
    const used = [DEFAULT_OPEN_LINKS[0]!];
    const available = availableBuiltInOpenLinks(used);
    expect(available).toHaveLength(DEFAULT_OPEN_LINKS.length - 1);
    expect(available.some((link) => link.path === used[0]!.path)).toBe(false);
  });
});

describe("sortOpenLinksByRecents", () => {
  it("orders by newest recent first, then configured order", () => {
    const links = [
      { name: "A", path: "/a" },
      { name: "B", path: "/b" },
      { name: "C", path: "/c" },
    ];
    expect(sortOpenLinksByRecents(links, { "/c": 10, "/a": 5 }).map((l) => l.path)).toEqual(["/c", "/a", "/b"]);
  });
});

describe("openLinksSchema", () => {
  it("requires at least one link and normalizes icons", () => {
    expect(openLinksSchema.safeParse([]).success).toBe(false);
    expect(
      openLinksSchema.parse([
        { name: " Home ", path: " /lightning/page/home " },
        { name: "Home", path: "/lightning/page/home" },
      ]),
    ).toEqual([{ name: "Home", path: "/lightning/page/home", icon: Icon.House }]);
  });
});
