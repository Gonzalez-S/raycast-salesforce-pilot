import { describe, expect, it } from "vitest";

import { filterIcons, parseCatalog } from "../src/icons/catalog";
import { iconPngUrl, iconSvgUrl } from "../src/icons/constants";

const sampleCatalog = [
  {
    name: "utility",
    icons: [
      { sprite: "utility", symbol: "add" },
      { sprite: "utility", symbol: "close" },
    ],
  },
  {
    name: "standard",
    icons: [{ sprite: "standard", symbol: "account" }],
  },
  {
    name: "unknown",
    icons: [{ sprite: "unknown", symbol: "nope" }],
  },
];

describe("parseCatalog", () => {
  it("flattens known categories and builds API names / CDN URLs", () => {
    const icons = parseCatalog(sampleCatalog);
    expect(icons).toEqual([
      {
        category: "standard",
        name: "account",
        apiName: "standard:account",
        pngUrl: iconPngUrl("standard", "account"),
        svgUrl: iconSvgUrl("standard", "account"),
      },
      {
        category: "utility",
        name: "add",
        apiName: "utility:add",
        pngUrl: iconPngUrl("utility", "add"),
        svgUrl: iconSvgUrl("utility", "add"),
      },
      {
        category: "utility",
        name: "close",
        apiName: "utility:close",
        pngUrl: iconPngUrl("utility", "close"),
        svgUrl: iconSvgUrl("utility", "close"),
      },
    ]);
  });

  it("rejects a non-array payload", () => {
    expect(() => parseCatalog({})).toThrow(/Unexpected Salesforce icons catalog/);
  });
});

describe("filterIcons", () => {
  it("filters by category or returns all", () => {
    const icons = parseCatalog(sampleCatalog);
    expect(filterIcons(icons, "utility").map((icon) => icon.name)).toEqual(["add", "close"]);
    expect(filterIcons(icons, "all")).toHaveLength(3);
  });
});
