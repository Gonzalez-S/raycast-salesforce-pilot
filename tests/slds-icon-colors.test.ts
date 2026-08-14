import { describe, expect, it } from "vitest";

import { composeChromeIcon, GLYPH_SCALE, recolorSvgFill, scaleSvg, STANDARD_RADIUS_RATIO } from "../src/icons/preview";
import { parseBackgroundTokens, rgbOrHexToHex } from "../src/slds/icon-colors";

describe("rgbOrHexToHex", () => {
  it("normalizes rgb() and hex values", () => {
    expect(rgbOrHexToHex("rgb(242, 139, 0)")).toBe("#f28b00");
    expect(rgbOrHexToHex("#569BE8")).toBe("#569be8");
  });
});

describe("parseBackgroundTokens", () => {
  it("maps custom/standard/action token keys to api names", () => {
    const map = parseBackgroundTokens({
      custom: {
        CUSTOM_1: "rgb(255, 123, 132)",
        CUSTOM_101: "rgb(242, 139, 0)",
      },
      standard: {
        ACCOUNT: "rgb(88, 103, 232)",
        CAMPAIGN_MEMBERS: "rgb(255, 93, 45)",
      },
      actions: {
        ACTION_NEW_TASK: "rgb(27, 150, 255)",
        ACTION_ADD_CONTACT: "rgb(6, 165, 154)",
      },
    });

    expect(map).toEqual({
      "custom:custom1": "#ff7b84",
      "custom:custom101": "#f28b00",
      "standard:account": "#5867e8",
      "standard:campaign_members": "#ff5d2d",
      "action:new_task": "#1b96ff",
      "action:add_contact": "#06a59a",
    });
  });
});

describe("composeChromeIcon", () => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#fff"><path d="M0 0h10v10H0z"/></svg>`;

  it("uses a rounded square and scaled glyph", () => {
    const composed = composeChromeIcon(svg, { background: "#5867e8", shape: "roundedSquare" });
    const radius = 100 * STANDARD_RADIUS_RATIO;
    expect(composed).toContain(`<rect width="100" height="100" rx="${radius}" ry="${radius}" fill="#5867e8"/>`);
    expect(composed).toContain(`scale(${GLYPH_SCALE})`);
    expect(composed).toContain('fill="#fff"');
  });

  it("uses a scaled circle for action chrome", () => {
    const composed = composeChromeIcon(svg, { background: "#1b96ff", shape: "circle" });
    expect(composed).toContain('<circle cx="50" cy="50" r="50" fill="#1b96ff"/>');
    expect(composed).toContain(`scale(${GLYPH_SCALE})`);
  });
});

describe("recolorSvgFill / scaleSvg", () => {
  it("scales utility and doctype glyphs", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#fff"><path d="M0 0h10v10H0z" fill="#fff"/></svg>`;
    expect(recolorSvgFill(svg, "#54698d")).toContain(`scale(${GLYPH_SCALE})`);
    expect(recolorSvgFill(svg, "#54698d")).toContain("#54698d");
    expect(scaleSvg(svg)).toContain(`scale(${GLYPH_SCALE})`);
  });
});
