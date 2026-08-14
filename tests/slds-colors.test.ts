import { describe, expect, it } from "vitest";

import { colorDisplayName, filterColors, parseCosmosThemeCss, parseLightDark, swatchDataUri } from "../src/slds/colors";

describe("parseLightDark", () => {
  it("parses dual and single values", () => {
    expect(parseLightDark("light-dark(#fff, #242424)")).toEqual({
      light: "#ffffff",
      dark: "#242424",
      dual: true,
    });
    expect(parseLightDark("#0176d3")).toEqual({ light: "#0176d3", dark: "#0176d3", dual: false });
  });
});

describe("parseCosmosThemeCss", () => {
  it("extracts palette, semantic, and resolved var() aliases", () => {
    const css = `
      :where(html){
        --slds-r-color-brand-50:#066afe;
        --slds-g-color-palette-blue-50:#0176d3;
        --slds-g-color-surface-1:light-dark(#fff, #242424);
        --slds-g-color-accent-1:var(--slds-r-color-brand-50);
        --slds-g-spacing-1:0.25rem;
      }
    `;
    const colors = parseCosmosThemeCss(css);
    expect(colors.map((color) => color.cssVar)).toEqual([
      "--slds-g-color-accent-1",
      "--slds-g-color-palette-blue-50",
      "--slds-g-color-surface-1",
      "--slds-r-color-brand-50",
    ]);
    expect(colors.find((color) => color.name === "slds-g-color-surface-1")).toMatchObject({
      group: "semantic",
      family: "surface",
      light: "#ffffff",
      dark: "#242424",
      dual: true,
    });
    expect(colors.find((color) => color.name === "slds-g-color-accent-1")).toMatchObject({
      light: "#066afe",
      dark: "#066afe",
      dual: false,
    });
    expect(colors.find((color) => color.name === "slds-g-color-palette-blue-50")?.family).toBe("blue");
  });
});

describe("filterColors", () => {
  it("filters by group and family", () => {
    const colors = parseCosmosThemeCss(`
      --slds-g-color-surface-1:light-dark(#fff, #000);
      --slds-g-color-palette-blue-50:#0176d3;
      --slds-g-color-palette-red-50:#ba0517;
    `);
    expect(filterColors(colors, "palette", "blue")).toHaveLength(1);
    expect(filterColors(colors, "semantic")).toHaveLength(1);
  });
});

describe("swatchDataUri", () => {
  it("embeds both colors for dual swatches", () => {
    const uri = swatchDataUri("#ffffff", "#242424", true);
    const svg = decodeURIComponent(uri);
    expect(uri.startsWith("data:image/svg+xml")).toBe(true);
    expect(svg).toContain("#ffffff");
    expect(svg).toContain("#242424");
    expect(svg).not.toContain("<line ");
  });
});

describe("colorDisplayName", () => {
  it("strips the slds color prefix for readable titles", () => {
    expect(colorDisplayName("--slds-g-color-brand-base-100")).toBe("brand-base-100");
    expect(colorDisplayName("--slds-r-color-brand-50")).toBe("brand-50");
  });
});
