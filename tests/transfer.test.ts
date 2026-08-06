import { describe, expect, it } from "vitest";

import { PRODUCTION_COLORS } from "../src/org/constants";
import { parseSettingsExport, SETTINGS_EXPORT_VERSION } from "../src/settings/transfer";

describe("parseSettingsExport", () => {
  it("accepts a valid v1 export and keeps palette colors", () => {
    const torch = PRODUCTION_COLORS[0].value;
    const payload = {
      version: SETTINGS_EXPORT_VERSION,
      exportedAt: "2026-08-07T00:00:00.000Z",
      orgSettings: {
        "user@example.com": {
          label: "Acme",
          color: torch,
          group: "US",
          pinned: true,
        },
      },
      orgProjects: {
        "user@example.com": { manualProjectIds: ["abc"] },
      },
      manualCatalog: {},
    };

    const parsed = parseSettingsExport(JSON.stringify(payload));
    expect(parsed.orgSettings["user@example.com"]).toEqual({
      label: "Acme",
      color: torch,
      group: "US",
      pinned: true,
    });
  });

  it("drops colors that are not in the current palette", () => {
    const payload = {
      version: SETTINGS_EXPORT_VERSION,
      exportedAt: "2026-08-07T00:00:00.000Z",
      orgSettings: {
        "user@example.com": {
          color: "#C62828",
          group: "US",
        },
      },
      orgProjects: {},
      manualCatalog: {},
    };

    const parsed = parseSettingsExport(JSON.stringify(payload));
    expect(parsed.orgSettings["user@example.com"].color).toBeUndefined();
  });

  it("rejects unknown export shapes", () => {
    expect(() => parseSettingsExport("{}")).toThrow(/settings export/i);
    expect(() => parseSettingsExport("not-json")).toThrow(/valid JSON/i);
  });
});
